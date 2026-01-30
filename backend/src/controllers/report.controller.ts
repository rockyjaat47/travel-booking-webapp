/**
 * REPORT CONTROLLER
 * HTTP request handlers for admin reports and analytics
 */

import { Request, Response } from 'express';
import { prisma } from '../server';
import { AuthenticatedRequest } from '../types';
import { asyncHandler, BadRequestError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

// ============================================================================
// SALES REPORT
// ============================================================================

/**
 * Get sales report
 * GET /api/v1/reports/sales
 */
export const getSalesReport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { startDate, endDate, groupBy = 'day' } = req.query;

  if (!startDate || !endDate) {
    throw new BadRequestError('Start date and end date are required');
  }

  const start = new Date(startDate as string);
  const end = new Date(endDate as string);
  end.setHours(23, 59, 59, 999);

  // Get bookings in date range
  const bookings = await prisma.booking.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
      status: {
        in: ['CONFIRMED', 'COMPLETED'],
      },
    },
    select: {
      category: true,
      totalAmount: true,
      createdAt: true,
    },
  });

  // Calculate totals
  const totalSales = bookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);
  
  // Sales by category
  const salesByCategory = bookings.reduce((acc, b) => {
    acc[b.category] = (acc[b.category] || 0) + Number(b.totalAmount);
    return acc;
  }, {} as Record<string, number>);

  // Sales by date (for chart)
  const salesByDate = bookings.reduce((acc, b) => {
    const date = b.createdAt.toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + Number(b.totalAmount);
    return acc;
  }, {} as Record<string, number>);

  // Convert to array format for charts
  const dailySales = Object.entries(salesByDate)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  res.status(200).json({
    success: true,
    message: 'Sales report generated',
    data: {
      summary: {
        totalSales,
        totalBookings: bookings.length,
        averageOrderValue: bookings.length > 0 ? totalSales / bookings.length : 0,
      },
      salesByCategory,
      dailySales,
    },
  });
});

// ============================================================================
// BOOKING REPORT
// ============================================================================

/**
 * Get booking report
 * GET /api/v1/reports/bookings
 */
export const getBookingReport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { startDate, endDate, category } = req.query;

  if (!startDate || !endDate) {
    throw new BadRequestError('Start date and end date are required');
  }

  const start = new Date(startDate as string);
  const end = new Date(endDate as string);
  end.setHours(23, 59, 59, 999);

  const where: any = {
    createdAt: {
      gte: start,
      lte: end,
    },
  };

  if (category) {
    where.category = category;
  }

  // Get bookings
  const bookings = await prisma.booking.findMany({
    where,
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Status breakdown
  const statusBreakdown = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Category breakdown
  const categoryBreakdown = bookings.reduce((acc, b) => {
    acc[b.category] = (acc[b.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  res.status(200).json({
    success: true,
    message: 'Booking report generated',
    data: {
      summary: {
        totalBookings: bookings.length,
        statusBreakdown,
        categoryBreakdown,
      },
      bookings,
    },
  });
});

// ============================================================================
// REVENUE REPORT
// ============================================================================

/**
 * Get revenue report
 * GET /api/v1/reports/revenue
 */
export const getRevenueReport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    throw new BadRequestError('Start date and end date are required');
  }

  const start = new Date(startDate as string);
  const end = new Date(endDate as string);
  end.setHours(23, 59, 59, 999);

  // Get confirmed bookings
  const bookings = await prisma.booking.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
      status: {
        in: ['CONFIRMED', 'COMPLETED'],
      },
    },
    select: {
      category: true,
      baseAmount: true,
      taxAmount: true,
      convenienceFee: true,
      addOnAmount: true,
      totalAmount: true,
    },
  });

  // Calculate revenue breakdown
  const revenue = bookings.reduce(
    (acc, b) => {
      acc.baseAmount += Number(b.baseAmount);
      acc.taxAmount += Number(b.taxAmount);
      acc.convenienceFee += Number(b.convenienceFee);
      acc.addOnAmount += Number(b.addOnAmount);
      acc.totalAmount += Number(b.totalAmount);
      return acc;
    },
    {
      baseAmount: 0,
      taxAmount: 0,
      convenienceFee: 0,
      addOnAmount: 0,
      totalAmount: 0,
    }
  );

  // Revenue by category
  const revenueByCategory = bookings.reduce((acc, b) => {
    if (!acc[b.category]) {
      acc[b.category] = {
        baseAmount: 0,
        taxAmount: 0,
        convenienceFee: 0,
        addOnAmount: 0,
        totalAmount: 0,
      };
    }
    acc[b.category].baseAmount += Number(b.baseAmount);
    acc[b.category].taxAmount += Number(b.taxAmount);
    acc[b.category].convenienceFee += Number(b.convenienceFee);
    acc[b.category].addOnAmount += Number(b.addOnAmount);
    acc[b.category].totalAmount += Number(b.totalAmount);
    return acc;
  }, {} as Record<string, any>);

  res.status(200).json({
    success: true,
    message: 'Revenue report generated',
    data: {
      summary: revenue,
      revenueByCategory,
    },
  });
});

// ============================================================================
// USER REPORT
// ============================================================================

/**
 * Get user report
 * GET /api/v1/reports/users
 */
export const getUserReport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { startDate, endDate } = req.query;

  const start = startDate ? new Date(startDate as string) : new Date(0);
  const end = endDate ? new Date(endDate as string) : new Date();
  end.setHours(23, 59, 59, 999);

  // New users in period
  const newUsers = await prisma.user.count({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
  });

  // Total users
  const totalUsers = await prisma.user.count();

  // Users by role
  const usersByRole = await prisma.user.groupBy({
    by: ['role'],
    _count: { id: true },
  });

  // Users by status
  const usersByStatus = await prisma.user.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  // Top users by bookings
  const topUsers = await prisma.user.findMany({
    take: 10,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      _count: {
        select: {
          bookings: true,
        },
      },
    },
    orderBy: {
      bookings: {
        _count: 'desc',
      },
    },
  });

  res.status(200).json({
    success: true,
    message: 'User report generated',
    data: {
      summary: {
        newUsers,
        totalUsers,
      },
      usersByRole,
      usersByStatus,
      topUsers,
    },
  });
});

// ============================================================================
// CANCELLATION REPORT
// ============================================================================

/**
 * Get cancellation report
 * GET /api/v1/reports/cancellations
 */
export const getCancellationReport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    throw new BadRequestError('Start date and end date are required');
  }

  const start = new Date(startDate as string);
  const end = new Date(endDate as string);
  end.setHours(23, 59, 59, 999);

  // Get cancellation requests
  const cancellations = await prisma.cancellationRequest.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    include: {
      booking: {
        select: {
          category: true,
          totalAmount: true,
        },
      },
    },
  });

  // Calculate totals
  const totalCancellations = cancellations.length;
  const totalRefundAmount = cancellations.reduce(
    (sum, c) => sum + Number(c.finalRefundAmount),
    0
  );
  const totalCancellationCharges = cancellations.reduce(
    (sum, c) => sum + Number(c.cancellationCharges),
    0
  );

  // By status
  const byStatus = cancellations.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // By category
  const byCategory = cancellations.reduce((acc, c) => {
    const category = c.booking?.category || 'UNKNOWN';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  res.status(200).json({
    success: true,
    message: 'Cancellation report generated',
    data: {
      summary: {
        totalCancellations,
        totalRefundAmount,
        totalCancellationCharges,
      },
      byStatus,
      byCategory,
      cancellations,
    },
  });
});