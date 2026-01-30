/**
 * ADMIN CONTROLLER
 * HTTP request handlers for admin operations
 */

import { Request, Response } from 'express';
import { prisma } from '../server';
import { AuthenticatedRequest, CreatePartnerRequest, UpdateInventoryRequest } from '../types';
import { asyncHandler, BadRequestError, NotFoundError } from '../middleware/error.middleware';
import { authorizeAdmin } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';
import { UserRole, UserStatus, PartnerStatus, BookingStatus } from '@prisma/client';

// ============================================================================
// DASHBOARD STATS
// ============================================================================

/**
 * Get dashboard statistics
 * GET /api/v1/admin/dashboard
 */
export const getDashboardStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get counts in parallel
  const [
    totalUsers,
    totalPartners,
    totalBookings,
    todayBookings,
    monthlyBookings,
    totalRevenue,
    monthlyRevenue,
    pendingCancellations,
    activeHolds,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.partner.count(),
    prisma.booking.count(),
    prisma.booking.count({ where: { createdAt: { gte: today } } }),
    prisma.booking.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.booking.aggregate({
      where: { status: 'CONFIRMED' },
      _sum: { totalAmount: true },
    }),
    prisma.booking.aggregate({
      where: { 
        status: 'CONFIRMED',
        createdAt: { gte: thirtyDaysAgo },
      },
      _sum: { totalAmount: true },
    }),
    prisma.cancellationRequest.count({
      where: { status: 'PENDING' },
    }),
    prisma.seatHold.count({
      where: { status: 'ACTIVE' },
    }),
  ]);

  // Get bookings by category
  const bookingsByCategory = await prisma.booking.groupBy({
    by: ['category'],
    _count: { id: true },
  });

  // Get recent bookings
  const recentBookings = await prisma.booking.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    message: 'Dashboard stats retrieved',
    data: {
      counts: {
        totalUsers,
        totalPartners,
        totalBookings,
        todayBookings,
        monthlyBookings,
      },
      revenue: {
        total: totalRevenue._sum.totalAmount || 0,
        monthly: monthlyRevenue._sum.totalAmount || 0,
      },
      pendingActions: {
        cancellations: pendingCancellations,
        activeHolds,
      },
      bookingsByCategory,
      recentBookings,
    },
  });
});

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * Get all users
 * GET /api/v1/admin/users
 */
export const getUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string;
  const role = req.query.role as string;
  const status = req.query.status as string;

  const where: any = {};

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (status) {
    where.status = status;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        isKycVerified: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            bookings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    message: 'Users retrieved',
    data: users,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/**
 * Get user by ID
 * GET /api/v1/admin/users/:id
 */
export const getUserById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      bookings: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
      wallet: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.status(200).json({
    success: true,
    message: 'User retrieved',
    data: user,
  });
});

/**
 * Update user status
 * PATCH /api/v1/admin/users/:id/status
 */
export const updateUserStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !Object.values(UserStatus).includes(status)) {
    throw new BadRequestError('Valid status is required');
  }

  const user = await prisma.user.update({
    where: { id },
    data: { status },
  });

  logger.info(`User ${id} status updated to ${status} by ${req.user?.email}`);

  res.status(200).json({
    success: true,
    message: 'User status updated',
    data: user,
  });
});

/**
 * Create admin user
 * POST /api/v1/admin/users/create-admin
 */
export const createAdminUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { email, phone, password, firstName, lastName } = req.body;

  // Check if user exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { phone }],
    },
  });

  if (existingUser) {
    throw new BadRequestError('User with this email or phone already exists');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create admin user
  const user = await prisma.user.create({
    data: {
      email,
      phone,
      password: hashedPassword,
      firstName,
      lastName,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      isPhoneVerified: true,
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

  logger.info(`Admin user created: ${email} by ${req.user?.email}`);

  res.status(201).json({
    success: true,
    message: 'Admin user created',
    data: user,
  });
});

// ============================================================================
// PARTNER MANAGEMENT
// ============================================================================

/**
 * Get all partners
 * GET /api/v1/admin/partners
 */
export const getPartners = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const type = req.query.type as string;
  const status = req.query.status as string;

  const where: any = {};

  if (type) {
    where.type = type;
  }

  if (status) {
    where.status = status;
  }

  const [partners, total] = await Promise.all([
    prisma.partner.findMany({
      where,
      include: {
        _count: {
          select: {
            busRoutes: true,
            flights: true,
            hotels: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.partner.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    message: 'Partners retrieved',
    data: partners,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/**
 * Create partner
 * POST /api/v1/admin/partners
 */
export const createPartner = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const data: CreatePartnerRequest = req.body;

  const partner = await prisma.partner.create({
    data: {
      name: data.name,
      type: data.type as any,
      email: data.email,
      phone: data.phone,
      address: data.address,
      city: data.city,
      state: data.state,
      country: data.country,
      pincode: data.pincode,
      gstNumber: data.gstNumber,
      panNumber: data.panNumber,
      holdQuotaEnabled: data.holdQuotaEnabled ?? true,
      holdQuotaPercentage: data.holdQuotaPercentage ?? 25,
      holdExpiryMinutes: data.holdExpiryMinutes ?? 30,
      status: PartnerStatus.ACTIVE,
    },
  });

  logger.info(`Partner created: ${partner.name} by ${req.user?.email}`);

  res.status(201).json({
    success: true,
    message: 'Partner created',
    data: partner,
  });
});

/**
 * Update partner
 * PATCH /api/v1/admin/partners/:id
 */
export const updatePartner = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const data = req.body;

  const partner = await prisma.partner.update({
    where: { id },
    data,
  });

  logger.info(`Partner updated: ${id} by ${req.user?.email}`);

  res.status(200).json({
    success: true,
    message: 'Partner updated',
    data: partner,
  });
});

/**
 * Update partner hold quota settings
 * PATCH /api/v1/admin/partners/:id/hold-quota
 */
export const updatePartnerHoldQuota = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { holdQuotaEnabled, holdQuotaPercentage, holdExpiryMinutes } = req.body;

  const partner = await prisma.partner.update({
    where: { id },
    data: {
      holdQuotaEnabled,
      holdQuotaPercentage,
      holdExpiryMinutes,
    },
  });

  logger.info(`Partner hold quota updated: ${id} by ${req.user?.email}`);

  res.status(200).json({
    success: true,
    message: 'Partner hold quota settings updated',
    data: partner,
  });
});

// ============================================================================
// BOOKING MANAGEMENT
// ============================================================================

/**
 * Get all bookings (admin view)
 * GET /api/v1/admin/bookings
 */
export const getAllBookings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const category = req.query.category as string;
  const search = req.query.search as string;

  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (category) {
    where.category = category;
  }

  if (search) {
    where.bookingNumber = { contains: search, mode: 'insensitive' };
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        passengers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            seatNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    message: 'Bookings retrieved',
    data: bookings,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/**
 * Update booking status
 * PATCH /api/v1/admin/bookings/:id/status
 */
export const updateBookingStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !Object.values(BookingStatus).includes(status as BookingStatus)) {
    throw new BadRequestError('Valid booking status is required');
  }

  const booking = await prisma.booking.update({
    where: { id },
    data: { status: status as BookingStatus },
  });

  logger.info(`Booking ${id} status updated to ${status} by ${req.user?.email}`);

  res.status(200).json({
    success: true,
    message: 'Booking status updated',
    data: booking,
  });
});

// ============================================================================
// CANCELLATION MANAGEMENT
// ============================================================================

/**
 * Get cancellation requests
 * GET /api/v1/admin/cancellations
 */
export const getCancellationRequests = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;

  const where: any = {};

  if (status) {
    where.status = status;
  }

  const [requests, total] = await Promise.all([
    prisma.cancellationRequest.findMany({
      where,
      include: {
        booking: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.cancellationRequest.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    message: 'Cancellation requests retrieved',
    data: requests,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/**
 * Process cancellation request
 * POST /api/v1/admin/cancellations/:id/process
 */
export const processCancellation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { action, notes } = req.body; // action: 'APPROVE' or 'REJECT'

  if (!action || !['APPROVE', 'REJECT'].includes(action)) {
    throw new BadRequestError('Action must be APPROVE or REJECT');
  }

  const cancellation = await prisma.cancellationRequest.update({
    where: { id },
    data: {
      status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      approvedBy: req.user?.id,
      approvedAt: new Date(),
    },
    include: {
      booking: true,
    },
  });

  // If approved, update booking and process refund
  if (action === 'APPROVE') {
    await prisma.booking.update({
      where: { id: cancellation.bookingId },
      data: {
        status: 'CANCELLED',
        refundAmount: cancellation.finalRefundAmount,
      },
    });

    // TODO: Process actual refund via payment gateway
  }

  logger.info(`Cancellation ${id} ${action}D by ${req.user?.email}`);

  res.status(200).json({
    success: true,
    message: `Cancellation ${action.toLowerCase()}ed`,
    data: cancellation,
  });
});