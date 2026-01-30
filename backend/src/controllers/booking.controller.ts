/**
 * BOOKING CONTROLLER
 * HTTP request handlers for booking operations
 */

import { Response } from 'express';
import { prisma } from '../server';
import { AuthenticatedRequest, CreateBookingRequest } from '../types';
import { asyncHandler, BadRequestError, NotFoundError } from '../middleware/error.middleware';
import {
  createBusBooking,
  createFlightBooking,
  createHotelBooking,
  confirmBooking,
  cancelBooking,
} from '../services/booking.service';
import { BookingCategory } from '@prisma/client';
import { logger } from '../utils/logger';

// ============================================================================
// CREATE BOOKING
// ============================================================================

/**
 * Create new booking
 * POST /api/v1/bookings
 */
export const createBooking = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }

  const data: CreateBookingRequest = req.body;

  // Validate category
  if (!data.category || !Object.values(BookingCategory).includes(data.category)) {
    throw new BadRequestError('Valid booking category is required (BUS, AIRLINE, HOTEL)');
  }

  // Validate passengers
  if (!data.passengers || data.passengers.length === 0) {
    throw new BadRequestError('At least one passenger is required');
  }

  let booking;

  // Create booking based on category
  switch (data.category) {
    case BookingCategory.BUS:
      if (!data.busScheduleId) {
        throw new BadRequestError('Bus schedule ID is required');
      }
      booking = await createBusBooking(userId, data);
      break;

    case BookingCategory.AIRLINE:
      if (!data.flightScheduleId) {
        throw new BadRequestError('Flight schedule ID is required');
      }
      booking = await createFlightBooking(userId, data);
      break;

    case BookingCategory.HOTEL:
      if (!data.roomInventoryId || !data.checkInDate || !data.checkOutDate) {
        throw new BadRequestError('Room inventory ID, check-in and check-out dates are required');
      }
      booking = await createHotelBooking(userId, data);
      break;

    default:
      throw new BadRequestError('Invalid booking category');
  }

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: booking,
  });
});

// ============================================================================
// GET BOOKINGS
// ============================================================================

/**
 * Get user's bookings
 * GET /api/v1/bookings
 */
export const getUserBookings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const category = req.query.category as string;

  const where: any = { userId };
  
  if (status) {
    where.status = status;
  }
  
  if (category) {
    where.category = category;
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        passengers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            seatNumber: true,
          },
        },
        busSchedule: {
          include: {
            route: {
              select: {
                source: true,
                destination: true,
                departureTime: true,
                arrivalTime: true,
                busType: true,
              },
            },
          },
        },
        flightSchedule: {
          include: {
            flight: {
              select: {
                flightNumber: true,
                airlineName: true,
                source: true,
                destination: true,
                departureTime: true,
                arrivalTime: true,
              },
            },
          },
        },
        roomInventory: {
          include: {
            room: {
              include: {
                hotel: {
                  select: {
                    name: true,
                    city: true,
                    address: true,
                  },
                },
              },
            },
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
    message: 'Bookings retrieved successfully',
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
 * Get booking by ID
 * GET /api/v1/bookings/:id
 */
export const getBookingById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }

  const booking = await prisma.booking.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      passengers: true,
      busSchedule: {
        include: {
          route: true,
        },
      },
      flightSchedule: {
        include: {
          flight: true,
          fareRules: true,
        },
      },
      roomInventory: {
        include: {
          room: {
            include: {
              hotel: true,
            },
          },
        },
      },
    },
  });

  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  res.status(200).json({
    success: true,
    message: 'Booking retrieved successfully',
    data: booking,
  });
});

// ============================================================================
// BOOKING CONFIRMATION
// ============================================================================

/**
 * Confirm booking after payment
 * PATCH /api/v1/bookings/:id/confirm
 */
export const confirmBookingHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentMethod, paidAmount } = req.body;

  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }

  // Verify booking belongs to user
  const existingBooking = await prisma.booking.findFirst({
    where: { id, userId },
  });

  if (!existingBooking) {
    throw new NotFoundError('Booking not found');
  }

  const booking = await confirmBooking(id, {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    paymentMethod,
    paidAmount,
  });

  res.status(200).json({
    success: true,
    message: 'Booking confirmed successfully',
    data: booking,
  });
});

// ============================================================================
// CANCELLATION
// ============================================================================

/**
 * Cancel booking
 * POST /api/v1/bookings/:id/cancel
 */
export const cancelBookingHandler = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;
  const { reason } = req.body;

  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }

  if (!reason) {
    throw new BadRequestError('Cancellation reason is required');
  }

  const result = await cancelBooking(id, userId, reason);

  res.status(200).json({
    success: true,
    message: 'Booking cancelled successfully',
    data: result,
  });
});

/**
 * Get cancellation details before confirming
 * GET /api/v1/bookings/:id/cancellation-details
 */
export const getCancellationDetails = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }

  const booking = await prisma.booking.findFirst({
    where: { id, userId },
  });

  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  const { calculateCancellationRefund } = await import('../services/booking.service');
  const refund = await calculateCancellationRefund(id);

  res.status(200).json({
    success: true,
    message: 'Cancellation details retrieved',
    data: refund,
  });
});

// ============================================================================
// DOWNLOAD TICKET/INVOICE
// ============================================================================

/**
 * Download booking ticket
 * GET /api/v1/bookings/:id/ticket
 */
export const downloadTicket = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }

  const booking = await prisma.booking.findFirst({
    where: { id, userId },
    include: {
      passengers: true,
      busSchedule: {
        include: {
          route: true,
        },
      },
      flightSchedule: {
        include: {
          flight: true,
        },
      },
      roomInventory: {
        include: {
          room: {
            include: {
              hotel: true,
            },
          },
        },
      },
    },
  });

  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  if (booking.status !== 'CONFIRMED') {
    throw new BadRequestError('Ticket only available for confirmed bookings');
  }

  // TODO: Generate PDF ticket
  // For now, return booking details
  res.status(200).json({
    success: true,
    message: 'Ticket details retrieved',
    data: booking,
  });
});