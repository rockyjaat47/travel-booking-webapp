/**
 * FLIGHT CONTROLLER
 * HTTP request handlers for flight operations
 */

import { Request, Response } from 'express';
import { prisma } from '../server';
import { asyncHandler, BadRequestError, NotFoundError } from '../middleware/error.middleware';
import { FlightSearchRequest } from '../types';
import { logger } from '../utils/logger';
import { ScheduleStatus } from '@prisma/client';

// ============================================================================
// SEARCH FLIGHTS
// ============================================================================

/**
 * Search available flights
 * GET /api/v1/flights/search
 */
export const searchFlights = asyncHandler(async (req: Request, res: Response) => {
  const {
    source,
    destination,
    departureDate,
    returnDate,
    passengers = 1,
    cabinClass = 'ECONOMY',
    tripType = 'one-way',
  } = req.query;

  if (!source || !destination || !departureDate) {
    throw new BadRequestError('Source, destination, and departure date are required');
  }

  const searchDate = new Date(departureDate as string);
  const startOfDay = new Date(searchDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(searchDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Find flights matching source and destination
  const flights = await prisma.flight.findMany({
    where: {
      source: { equals: source as string, mode: 'insensitive' },
      destination: { equals: destination as string, mode: 'insensitive' },
      isActive: true,
    },
    include: {
      partner: {
        select: {
          name: true,
        },
      },
      schedules: {
        where: {
          scheduleDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: ScheduleStatus.ACTIVE,
        },
        include: {
          fareRules: true,
        },
      },
    },
  });

  // Filter by availability and format response
  const passengerCount = parseInt(passengers as string);
  const results = flights.flatMap((flight) =>
    flight.schedules
      .filter((schedule) => {
        // Check availability based on cabin class
        switch (cabinClass) {
          case 'PREMIUM_ECONOMY':
            return schedule.premiumSeats - schedule.premiumBooked >= passengerCount;
          case 'BUSINESS':
            return schedule.businessSeats - schedule.businessBooked >= passengerCount;
          case 'FIRST':
            return schedule.firstSeats - schedule.firstBooked >= passengerCount;
          default:
            return schedule.economySeats - schedule.economyBooked >= passengerCount;
        }
      })
      .map((schedule) => ({
        scheduleId: schedule.id,
        flightId: flight.id,
        flightNumber: flight.flightNumber,
        airlineCode: flight.airlineCode,
        airlineName: flight.airlineName,
        source: flight.source,
        destination: flight.destination,
        sourceAirport: flight.sourceAirport,
        destinationAirport: flight.destinationAirport,
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        durationMinutes: flight.durationMinutes,
        aircraftType: flight.aircraftType,
        fares: {
          economy: schedule.economyFare,
          premium: schedule.premiumFare,
          business: schedule.businessFare,
          first: schedule.firstFare,
        },
        availability: {
          economy: schedule.economySeats - schedule.economyBooked,
          premium: schedule.premiumSeats - schedule.premiumBooked,
          business: schedule.businessSeats - schedule.businessBooked,
          first: schedule.firstSeats - schedule.firstBooked,
        },
        fareRules: schedule.fareRules,
      }))
  );

  // TODO: Handle round-trip search if returnDate is provided

  res.status(200).json({
    success: true,
    message: 'Flight search results',
    data: results,
    meta: {
      source,
      destination,
      departureDate,
      returnDate,
      passengers,
      cabinClass,
      tripType,
      resultCount: results.length,
    },
  });
});

// ============================================================================
// GET FLIGHT DETAILS
// ============================================================================

/**
 * Get flight schedule details
 * GET /api/v1/flights/schedules/:id
 */
export const getScheduleDetails = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const schedule = await prisma.flightSchedule.findUnique({
    where: { id },
    include: {
      flight: {
        include: {
          partner: {
            select: {
              name: true,
            },
          },
        },
      },
      fareRules: true,
    },
  });

  if (!schedule) {
    throw new NotFoundError('Schedule not found');
  }

  res.status(200).json({
    success: true,
    message: 'Flight schedule details retrieved',
    data: schedule,
  });
});

// ============================================================================
// GET FARE RULES
// ============================================================================

/**
 * Get fare rules for a schedule
 * GET /api/v1/flights/schedules/:id/fare-rules
 */
export const getFareRules = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const schedule = await prisma.flightSchedule.findUnique({
    where: { id },
    include: {
      fareRules: true,
    },
  });

  if (!schedule) {
    throw new NotFoundError('Schedule not found');
  }

  res.status(200).json({
    success: true,
    message: 'Fare rules retrieved',
    data: schedule.fareRules,
  });
});

// ============================================================================
// ADMIN: MANAGE FLIGHTS
// ============================================================================

/**
 * Create flight (Admin)
 * POST /api/v1/flights
 */
export const createFlight = asyncHandler(async (req: Request, res: Response) => {
  const {
    partnerId,
    flightNumber,
    airlineCode,
    airlineName,
    source,
    destination,
    sourceAirport,
    destinationAirport,
    departureTime,
    arrivalTime,
    durationMinutes,
    operatingDays,
    aircraftType,
  } = req.body;

  const flight = await prisma.flight.create({
    data: {
      partnerId,
      flightNumber,
      airlineCode,
      airlineName,
      source,
      destination,
      sourceAirport,
      destinationAirport,
      departureTime: new Date(departureTime),
      arrivalTime: new Date(arrivalTime),
      durationMinutes,
      operatingDays,
      aircraftType,
    },
  });

  logger.info(`Flight created: ${flightNumber}`);

  res.status(201).json({
    success: true,
    message: 'Flight created',
    data: flight,
  });
});

/**
 * Create flight schedule (Admin)
 * POST /api/v1/flights/schedules
 */
export const createSchedule = asyncHandler(async (req: Request, res: Response) => {
  const {
    flightId,
    scheduleDate,
    economyFare,
    premiumFare,
    businessFare,
    firstFare,
    economySeats,
    premiumSeats,
    businessSeats,
    firstSeats,
    fareRulesId,
  } = req.body;

  const schedule = await prisma.flightSchedule.create({
    data: {
      flightId,
      scheduleDate: new Date(scheduleDate),
      economyFare,
      premiumFare,
      businessFare,
      firstFare,
      economySeats,
      premiumSeats,
      businessSeats,
      firstSeats,
      fareRulesId,
      status: ScheduleStatus.ACTIVE,
    },
  });

  logger.info(`Flight schedule created: ${flightId} for ${scheduleDate}`);

  res.status(201).json({
    success: true,
    message: 'Flight schedule created',
    data: schedule,
  });
});

/**
 * Create fare rules (Admin)
 * POST /api/v1/flights/fare-rules
 */
export const createFareRules = asyncHandler(async (req: Request, res: Response) => {
  const {
    cancellationFreeWithinHours,
    cancellationChargePercentage,
    cancellationChargeFixed,
    noShowChargePercentage,
    rescheduleAllowed,
    rescheduleCharge,
    cabinBaggageKg,
    checkInBaggageKg,
    refundProcessingDays,
  } = req.body;

  const fareRules = await prisma.fareRules.create({
    data: {
      cancellationFreeWithinHours,
      cancellationChargePercentage,
      cancellationChargeFixed,
      noShowChargePercentage,
      rescheduleAllowed,
      rescheduleCharge,
      cabinBaggageKg,
      checkInBaggageKg,
      refundProcessingDays,
    },
  });

  logger.info(`Fare rules created: ${fareRules.id}`);

  res.status(201).json({
    success: true,
    message: 'Fare rules created',
    data: fareRules,
  });
});