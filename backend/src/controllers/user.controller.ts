/**
 * USER CONTROLLER
 * HTTP request handlers for user profile operations
 */

import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../server';
import { AuthenticatedRequest, UpdateProfileRequest, UpdateKycRequest } from '../types';
import { asyncHandler, BadRequestError, NotFoundError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

// ============================================================================
// GET PROFILE
// ============================================================================

/**
 * Get user profile
 * GET /api/v1/users/profile
 */
export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      gender: true,
      profileImage: true,
      role: true,
      status: true,
      isEmailVerified: true,
      isPhoneVerified: true,
      isKycVerified: true,
      kycDocumentType: true,
      kycDocumentNumber: true,
      createdAt: true,
      wallet: {
        select: {
          balance: true,
          currency: true,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.status(200).json({
    success: true,
    message: 'Profile retrieved',
    data: user,
  });
});

// ============================================================================
// UPDATE PROFILE
// ============================================================================

/**
 * Update user profile
 * PUT /api/v1/users/profile
 */
export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }

  const { firstName, lastName, dateOfBirth, gender, profileImage }: UpdateProfileRequest = req.body;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
      ...(gender && { gender }),
      ...(profileImage && { profileImage }),
    },
    select: {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      gender: true,
      profileImage: true,
      updatedAt: true,
    },
  });

  logger.info(`Profile updated for user ${userId}`);

  res.status(200).json({
    success: true,
    message: 'Profile updated',
    data: user,
  });
});

// ============================================================================
// CHANGE PASSWORD
// ============================================================================

/**
 * Change password
 * PUT /api/v1/users/change-password
 */
export const changePassword = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new BadRequestError('Current password and new password are required');
  }

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      password: true,
    },
  });

  if (!user || !user.password) {
    throw new BadRequestError('User not found or password not set');
  }

  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    throw new BadRequestError('Current password is incorrect');
  }

  // Validate new password
  if (newPassword.length < 8) {
    throw new BadRequestError('New password must be at least 8 characters');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  // Invalidate all sessions
  await prisma.userSession.updateMany({
    where: { userId },
    data: { isValid: false },
  });

  logger.info(`Password changed for user ${userId}`);

  res.status(200).json({
    success: true,
    message: 'Password changed successfully. Please login again.',
  });
});

// ============================================================================
// KYC VERIFICATION
// ============================================================================

/**
 * Submit KYC documents
 * POST /api/v1/users/kyc
 */
export const submitKyc = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }

  const { documentType, documentNumber, documentImage }: UpdateKycRequest = req.body;

  if (!documentType || !documentNumber || !documentImage) {
    throw new BadRequestError('Document type, number, and image are required');
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      kycDocumentType: documentType,
      kycDocumentNumber: documentNumber,
      kycDocumentImage: documentImage,
      // KYC is pending verification by admin
    },
    select: {
      id: true,
      kycDocumentType: true,
      kycDocumentNumber: true,
      isKycVerified: true,
    },
  });

  logger.info(`KYC submitted for user ${userId}`);

  res.status(200).json({
    success: true,
    message: 'KYC documents submitted for verification',
    data: user,
  });
});

// ============================================================================
// PASSENGERS / TRAVELLERS
// ============================================================================

/**
 * Get saved passengers
 * GET /api/v1/users/passengers
 */
export const getPassengers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }

  const passengers = await prisma.passenger.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({
    success: true,
    message: 'Passengers retrieved',
    data: passengers,
  });
});

/**
 * Add passenger
 * POST /api/v1/users/passengers
 */
export const addPassenger = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }

  const { firstName, lastName, dateOfBirth, gender, phone, email, idType, idNumber } = req.body;

  if (!firstName || !lastName) {
    throw new BadRequestError('First name and last name are required');
  }

  const passenger = await prisma.passenger.create({
    data: {
      userId,
      firstName,
      lastName,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender,
      phone,
      email,
      idType,
      idNumber,
    },
  });

  logger.info(`Passenger added for user ${userId}`);

  res.status(201).json({
    success: true,
    message: 'Passenger added',
    data: passenger,
  });
});

/**
 * Update passenger
 * PUT /api/v1/users/passengers/:id
 */
export const updatePassenger = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }

  const passenger = await prisma.passenger.findFirst({
    where: { id, userId },
  });

  if (!passenger) {
    throw new NotFoundError('Passenger not found');
  }

  const { firstName, lastName, dateOfBirth, gender, phone, email, idType, idNumber } = req.body;

  const updatedPassenger = await prisma.passenger.update({
    where: { id },
    data: {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
      ...(gender && { gender }),
      ...(phone && { phone }),
      ...(email && { email }),
      ...(idType && { idType }),
      ...(idNumber && { idNumber }),
    },
  });

  res.status(200).json({
    success: true,
    message: 'Passenger updated',
    data: updatedPassenger,
  });
});

/**
 * Delete passenger
 * DELETE /api/v1/users/passengers/:id
 */
export const deletePassenger = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }

  const passenger = await prisma.passenger.findFirst({
    where: { id, userId },
  });

  if (!passenger) {
    throw new NotFoundError('Passenger not found');
  }

  await prisma.passenger.delete({
    where: { id },
  });

  res.status(200).json({
    success: true,
    message: 'Passenger deleted',
  });
});