/**
 * BUS CONTROLLER
 * HTTP request handlers for bus operations
 */

import { Request, Response } from 'express';
import { prisma } from '../server';
import { asyncHandler, BadRequestError, NotFoundError } from '../middleware/error.middleware';
import { BusSearchRequest } from '../types';
import { logger } from '../utils/logger';
import { ScheduleStatus } from '@prisma/client';

// ============================================================================
// SEARCH BUSES
// ============================================================================

/**
 * Search available buses
 * GET /api/v1/buses/search
 */
export const searchBuses = asyncHandler(async (req: Request, res: Response) => {
  const { source, destination, travelDate, passengers = 1 } = req.query;

  if (!source || !destination || !travelDate) {
    throw new BadRequestError('Source, destination, and travel date are required');
  }

  const searchDate = new Date(travelDate as string);
  const startOfDay = new Date(searchDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(searchDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Find routes matching source and destination
  const routes = await prisma.busRoute.findMany({
    where: {
      source: { contains: source as string, mode: 'insensitive' },
      destination: { contains: destination as string, mode: 'insensitive' },
      isActive: true,
    },
    include: {
      partner: {
        select: {
          name: true,
          holdQuotaEnabled: true,
        },
      },
      schedules: {
        where: {
          scheduleDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: ScheduleStatus.ACTIVE,
          availableSeats: {
            gte: parseInt(passengers as string),
          },
        },
        orderBy: {
          route: {
            departureTime: 'asc',
          },
        },
      },
    },
  });

  // Format response
  const results = routes.flatMap((route) =>
    route.schedules.map((schedule) => ({
      scheduleId: schedule.id,
      routeId: route.id,
      operator: route.partner.name,
      routeNumber: route.routeNumber,
      source: route.source,
      destination: route.destination,
      sourceStation: route.sourceStation,
      destinationStation: route.destinationStation,
      busType: route.busType,
      amenities: route.amenities,
      departureTime: route.departureTime,
      arrivalTime: route.arrivalTime,
      durationMinutes: route.durationMinutes,
      distanceKm: route.distanceKm,
      fare: schedule.baseFare,
      availableSeats: schedule.availableSeats,
      totalSeats: route.totalSeats,
      seatLayout: route.seatLayout,
      seatStatus: schedule.seatStatus,
      holdQuotaEnabled: route.partner.holdQuotaEnabled,
    }))
  );

  res.status(200).json({
    success: true,
    message: 'Bus search results',
    data: results,
    meta: {
      source,
      destination,
      travelDate,
      passengers,
      resultCount: results.length,
    },
  });
});

// ============================================================================
// GET BUS DETAILS
// ============================================================================

/**
 * Get bus schedule details
 * GET /api/v1/buses/schedules/:id
 */
export const getScheduleDetails = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const schedule = await prisma.busSchedule.findUnique({
    where: { id },
    include: {
      route: {
        include: {
          partner: {
            select: {
              name: true,
              phone: true,
              holdQuotaEnabled: true,
              holdQuotaPercentage: true,
              holdExpiryMinutes: true,
            },
          },
        },
      },
      holds: {
        where: {
          status: 'ACTIVE',
        },
        select: {
          seatNumbers: true,
          holdExpiry: true,
        },
      },
    },
  });

  if (!schedule) {
    throw new NotFoundError('Schedule not found');
  }

  res.status(200).json({
    success: true,
    message: 'Schedule details retrieved',
    data: schedule,
  });
});

// ============================================================================
// GET SEAT LAYOUT
// ============================================================================

/**
 * Get seat layout with availability
 * GET /api/v1/buses/schedules/:id/seats
 */
export const getSeatLayout = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const schedule = await prisma.busSchedule.findUnique({
    where: { id },
    include: {
      route: {
        select: {
          seatLayout: true,
          totalSeats: true,
        },
      },
    },
  });

  if (!schedule) {
    throw new NotFoundError('Schedule not found');
  }

  const seatStatus = schedule.seatStatus as Record<string, string>;
  const seatLayout = schedule.route.seatLayout as any;

  // Format seat data
  const seats = Object.entries(seatStatus).map(([seatNumber, status]) => ({
    seatNumber,
    status,
    // Add price variation based on seat type if needed
    price: 0,
  }));

  res.status(200).json({
    success: true,
    message: 'Seat layout retrieved',
    data: {
      layout: seatLayout,
      seats,
      totalSeats: schedule.route.totalSeats,
      availableSeats: schedule.availableSeats,
      bookedSeats: schedule.bookedSeats,
      heldSeats: schedule.heldSeats,
    },
  });
});

// ============================================================================
// ADMIN: MANAGE ROUTES
// ============================================================================

/**
 * Create bus route (Admin)
 * POST /api/v1/buses/routes
 */
export const createRoute = asyncHandler(async (req: Request, res: Response) => {
  const {
    partnerId,
    routeNumber,
    source,
    destination,
    sourceStation,
    destinationStation,
    distanceKm,
    durationMinutes,
    busType,
    busNumber,
    amenities,
    departureTime,
    arrivalTime,
    operatingDays,
    baseFare,
    totalSeats,
    seatLayout,
  } = req.body;

  const route = await prisma.busRoute.create({
    data: {
      partnerId,
      routeNumber,
      source,
      destination,
      sourceStation,
      destinationStation,
      distanceKm,
      durationMinutes,
      busType,
      busNumber,
      amenities,
      departureTime: new Date(departureTime),
      arrivalTime: new Date(arrivalTime),
      operatingDays,
      baseFare,
      totalSeats,
      seatLayout,
    },
  });

  logger.info(`Bus route created: ${routeNumber}`);

  res.status(201).json({
    success: true,
    message: 'Bus route created',
    data: route,
  });
});

/**
 * Create bus schedule (Admin)
 * POST /api/v1/buses/schedules
 */
export const createSchedule = asyncHandler(async (req: Request, res: Response) => {
  const { routeId, scheduleDate, baseFare } = req.body;

  const route = await prisma.busRoute.findUnique({
    where: { id: routeId },
  });

  if (!route) {
    throw new NotFoundError('Route not found');
  }

  // Initialize seat status
  const seatStatus: Record<string, string> = {};
  const seatLayout = route.seatLayout as any;
  
  // Generate seat numbers based on layout
  if (seatLayout && seatLayout.seats) {
    seatLayout.seats.forEach((seat: any) => {
      seatStatus[seat.number] = 'AVAILABLE';
    });
  } else {
    // Default seat numbering
    for (let i = 1; i <= route.totalSeats; i++) {
      seatStatus[`${i}`] = 'AVAILABLE';
    }
  }

  const schedule = await prisma.busSchedule.create({
    data: {
      routeId,
      scheduleDate: new Date(scheduleDate),
      baseFare: baseFare || route.baseFare,
      availableSeats: route.totalSeats,
      seatStatus,
      status: ScheduleStatus.ACTIVE,
    },
  });

  logger.info(`Bus schedule created: ${routeId} for ${scheduleDate}`);

  res.status(201).json({
    success: true,
    message: 'Bus schedule created',
    data: schedule,
  });
});