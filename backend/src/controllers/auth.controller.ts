/**
 * AUTHENTICATION CONTROLLER
 * Handles user registration, login, OTP, and token management
 */

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../server';
import { 
  RegisterRequest, 
  LoginRequest, 
  OtpRequest, 
  OtpVerifyRequest,
  AuthenticatedRequest 
} from '../types';
import { 
  BadRequestError, 
  UnauthorizedError, 
  ConflictError,
  NotFoundError 
} from '../middleware/error.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { generateOtp, sendOtpSms } from '../utils/otp';
import { logger } from '../utils/logger';
import { UserRole, UserStatus } from '@prisma/client';

// ============================================================================
// CONFIGURATION
// ============================================================================

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate JWT tokens
 */
const generateTokens = (userId: string, email: string, role: UserRole) => {
  const accessToken = jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { userId, email, role },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
};

/**
 * Create user session
 */
const createSession = async (
  userId: string,
  token: string,
  req: Request,
  expiresAt: Date
) => {
  await prisma.userSession.create({
    data: {
      userId,
      token,
      deviceInfo: req.get('user-agent') || 'Unknown',
      ipAddress: req.ip || 'Unknown',
      expiresAt,
    },
  });
};

// ============================================================================
// REGISTRATION
// ============================================================================

/**
 * Register new user
 * POST /api/v1/auth/register
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, phone, password, firstName, lastName }: RegisterRequest = req.body;

  // Validate required fields
  if (!email || !phone || !password || !firstName || !lastName) {
    throw new BadRequestError('All fields are required');
  }

  // Check if user already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { phone }],
    },
  });

  if (existingUser) {
    throw new ConflictError('User with this email or phone already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      phone,
      password: hashedPassword,
      firstName,
      lastName,
      status: UserStatus.ACTIVE,
      isEmailVerified: false,
      isPhoneVerified: false,
    },
    select: {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  // Create wallet for user
  await prisma.wallet.create({
    data: {
      userId: user.id,
      balance: 0,
      currency: 'INR',
    },
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id, user.email, UserRole.CUSTOMER);

  // Create session
  const refreshExpiresAt = new Date();
  refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);
  await createSession(user.id, refreshToken, req, refreshExpiresAt);

  logger.info(`New user registered: ${user.email}`);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: JWT_EXPIRES_IN,
      },
    },
  });
});

// ============================================================================
// LOGIN
// ============================================================================

/**
 * Login with email/phone and password
 * POST /api/v1/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, phone, password, otp, loginMethod }: LoginRequest = req.body;

  // Validate login method
  if (!loginMethod || !['password', 'otp'].includes(loginMethod)) {
    throw new BadRequestError('Valid login method required (password or otp)');
  }

  let user;

  if (loginMethod === 'password') {
    // Password-based login
    if (!password) {
      throw new BadRequestError('Password is required');
    }

    if (!email && !phone) {
      throw new BadRequestError('Email or phone is required');
    }

    // Find user
    user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (!user || !user.password) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }
  } else {
    // OTP-based login
    if (!phone || !otp) {
      throw new BadRequestError('Phone and OTP are required');
    }

    // Verify OTP
    const otpLog = await prisma.otpLog.findFirst({
      where: {
        phone,
        otp,
        purpose: 'LOGIN',
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpLog) {
      throw new UnauthorizedError('Invalid or expired OTP');
    }

    // Mark OTP as used
    await prisma.otpLog.update({
      where: { id: otpLog.id },
      data: { isUsed: true },
    });

    // Find or create user
    user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      // Auto-create user for OTP login
      user = await prisma.user.create({
        data: {
          phone,
          email: `${phone}@temp.leantravel.com`, // Temporary email
          firstName: 'Guest',
          lastName: 'User',
          status: UserStatus.ACTIVE,
          isPhoneVerified: true,
        },
      });

      // Create wallet
      await prisma.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
          currency: 'INR',
        },
      });
    }
  }

  // Check user status
  if (user.status === UserStatus.SUSPENDED) {
    throw new UnauthorizedError('Account has been suspended. Please contact support.');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

  // Create session
  const refreshExpiresAt = new Date();
  refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);
  await createSession(user.id, refreshToken, req, refreshExpiresAt);

  logger.info(`User logged in: ${user.email}`);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: JWT_EXPIRES_IN,
      },
    },
  });
});

// ============================================================================
// OTP MANAGEMENT
// ============================================================================

/**
 * Send OTP to phone
 * POST /api/v1/auth/otp/send
 */
export const sendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { phone, purpose }: OtpRequest = req.body;

  if (!phone || !purpose) {
    throw new BadRequestError('Phone and purpose are required');
  }

  // Generate OTP
  const otp = generateOtp();

  // Set expiry (10 minutes)
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  // Save OTP log
  await prisma.otpLog.create({
    data: {
      phone,
      otp,
      purpose,
      expiresAt,
    },
  });

  // Send OTP via SMS (mock for MVP)
  if (process.env.NODE_ENV === 'production') {
    await sendOtpSms(phone, otp);
  }

  logger.info(`OTP sent to ${phone} for ${purpose}`);

  res.status(200).json({
    success: true,
    message: 'OTP sent successfully',
    data: {
      // Only return OTP in development
      ...(process.env.NODE_ENV === 'development' && { otp }),
      expiresAt,
    },
  });
});

/**
 * Verify OTP
 * POST /api/v1/auth/otp/verify
 */
export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { phone, otp, purpose }: OtpVerifyRequest = req.body;

  if (!phone || !otp || !purpose) {
    throw new BadRequestError('Phone, OTP, and purpose are required');
  }

  // Find valid OTP
  const otpLog = await prisma.otpLog.findFirst({
    where: {
      phone,
      otp,
      purpose,
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpLog) {
    throw new BadRequestError('Invalid or expired OTP');
  }

  // Mark OTP as used
  await prisma.otpLog.update({
    where: { id: otpLog.id },
    data: { isUsed: true },
  });

  res.status(200).json({
    success: true,
    message: 'OTP verified successfully',
    data: {
      verified: true,
      phone,
    },
  });
});

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new BadRequestError('Refresh token is required');
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_REFRESH_SECRET) as {
      userId: string;
      email: string;
      role: UserRole;
    };
  } catch {
    throw new UnauthorizedError('Invalid refresh token');
  }

  // Check if session exists and is valid
  const session = await prisma.userSession.findFirst({
    where: {
      token,
      isValid: true,
      expiresAt: { gt: new Date() },
    },
  });

  if (!session) {
    throw new UnauthorizedError('Session expired or invalid');
  }

  // Generate new tokens
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(
    decoded.userId,
    decoded.email,
    decoded.role
  );

  // Invalidate old session
  await prisma.userSession.update({
    where: { id: session.id },
    data: { isValid: false },
  });

  // Create new session
  const refreshExpiresAt = new Date();
  refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);
  await createSession(decoded.userId, newRefreshToken, req, refreshExpiresAt);

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: JWT_EXPIRES_IN,
    },
  });
});

/**
 * Logout user
 * POST /api/v1/auth/logout
 */
export const logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    // Invalidate session
    await prisma.userSession.updateMany({
      where: { token },
      data: { isValid: false },
    });
  }

  logger.info(`User logged out: ${req.user?.email || 'Unknown'}`);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * Logout from all devices
 * POST /api/v1/auth/logout-all
 */
export const logoutAll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  // Invalidate all sessions
  await prisma.userSession.updateMany({
    where: { userId },
    data: { isValid: false },
  });

  logger.info(`User logged out from all devices: ${req.user?.email}`);

  res.status(200).json({
    success: true,
    message: 'Logged out from all devices successfully',
  });
});