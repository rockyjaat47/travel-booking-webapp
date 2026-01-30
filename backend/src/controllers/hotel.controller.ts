/**
 * HOTEL CONTROLLER
 * HTTP request handlers for hotel operations
 */

import { Request, Response } from 'express';
import { prisma } from '../server';
import { asyncHandler, BadRequestError, NotFoundError } from '../middleware/error.middleware';
import { HotelSearchRequest } from '../types';
import { logger } from '../utils/logger';
import { HotelStatus } from '@prisma/client';

// ============================================================================
// SEARCH HOTELS
// ============================================================================

/**
 * Search available hotels
 * GET /api/v1/hotels/search
 */
export const searchHotels = asyncHandler(async (req: Request, res: Response) => {
  const {
    city,
    checkInDate,
    checkOutDate,
    guests = 2,
    rooms = 1,
    starRating,
    minPrice,
    maxPrice,
  } = req.query;

  if (!city || !checkInDate || !checkOutDate) {
    throw new BadRequestError('City, check-in date, and check-out date are required');
  }

  const checkIn = new Date(checkInDate as string);
  const checkOut = new Date(checkOutDate as string);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  if (nights <= 0) {
    throw new BadRequestError('Check-out date must be after check-in date');
  }

  // Build where clause
  const where: any = {
    city: { contains: city as string, mode: 'insensitive' },
    status: HotelStatus.ACTIVE,
  };

  if (starRating) {
    const ratings = (starRating as string).split(',').map(Number);
    where.starRating = { in: ratings };
  }

  // Find hotels with available rooms
  const hotels = await prisma.hotel.findMany({
    where,
    include: {
      partner: {
        select: {
          name: true,
        },
      },
      rooms: {
        where: {
          maxAdults: {
            gte: Math.ceil(parseInt(guests as string) / parseInt(rooms as string)),
          },
        },
        include: {
          inventory: {
            where: {
              date: {
                gte: checkIn,
                lt: checkOut,
              },
              isAvailable: true,
              availableRooms: {
                gte: parseInt(rooms as string),
              },
            },
          },
        },
      },
    },
  });

  // Filter hotels with sufficient inventory for all nights
  const availableHotels = hotels.filter((hotel) => {
    return hotel.rooms.some((room) => {
      // Check if inventory exists for all nights
      return room.inventory.length === nights;
    });
  });

  // Format response
  const results = availableHotels.map((hotel) => ({
    hotelId: hotel.id,
    name: hotel.name,
    type: hotel.type,
    starRating: hotel.starRating,
    address: hotel.address,
    city: hotel.city,
    state: hotel.state,
    amenities: hotel.amenities,
    images: hotel.images,
    checkInTime: hotel.checkInTime,
    checkOutTime: hotel.checkOutTime,
    rooms: hotel.rooms
      .filter((room) => room.inventory.length === nights)
      .map((room) => {
        // Calculate total price for all nights
        const totalPrice = room.inventory.reduce((sum, inv) => sum + Number(inv.price), 0);
        const averagePrice = totalPrice / nights;

        return {
          roomId: room.id,
          roomType: room.roomType,
          roomCategory: room.roomCategory,
          roomSize: room.roomSize,
          maxAdults: room.maxAdults,
          maxChildren: room.maxChildren,
          bedType: room.bedType,
          amenities: room.amenities,
          images: room.images,
          totalRooms: room.totalRooms,
          pricePerNight: averagePrice,
          totalPrice,
          nights,
          inventory: room.inventory.map((inv) => ({
            inventoryId: inv.id,
            date: inv.date,
            price: inv.price,
          })),
        };
      })
      .filter((room) => {
        // Apply price filters
        if (minPrice && room.totalPrice < parseFloat(minPrice as string)) return false;
        if (maxPrice && room.totalPrice > parseFloat(maxPrice as string)) return false;
        return true;
      }),
  })).filter((hotel) => hotel.rooms.length > 0);

  res.status(200).json({
    success: true,
    message: 'Hotel search results',
    data: results,
    meta: {
      city,
      checkInDate,
      checkOutDate,
      guests,
      rooms,
      nights,
      resultCount: results.length,
    },
  });
});

// ============================================================================
// GET HOTEL DETAILS
// ============================================================================

/**
 * Get hotel details
 * GET /api/v1/hotels/:id
 */
export const getHotelDetails = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { checkInDate, checkOutDate } = req.query;

  const hotel = await prisma.hotel.findUnique({
    where: { id },
    include: {
      partner: {
        select: {
          name: true,
        },
      },
      rooms: {
        include: {
          inventory: checkInDate && checkOutDate
            ? {
                where: {
                  date: {
                    gte: new Date(checkInDate as string),
                    lt: new Date(checkOutDate as string),
                  },
                },
              }
            : false,
        },
      },
    },
  });

  if (!hotel) {
    throw new NotFoundError('Hotel not found');
  }

  res.status(200).json({
    success: true,
    message: 'Hotel details retrieved',
    data: hotel,
  });
});

// ============================================================================
// GET ROOM DETAILS
// ============================================================================

/**
 * Get room details
 * GET /api/v1/hotels/rooms/:id
 */
export const getRoomDetails = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { checkInDate, checkOutDate } = req.query;

  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      hotel: true,
      inventory: checkInDate && checkOutDate
        ? {
            where: {
              date: {
                gte: new Date(checkInDate as string),
                lt: new Date(checkOutDate as string),
              },
            },
          }
        : false,
    },
  });

  if (!room) {
    throw new NotFoundError('Room not found');
  }

  res.status(200).json({
    success: true,
    message: 'Room details retrieved',
    data: room,
  });
});

// ============================================================================
// ADMIN: MANAGE HOTELS
// ============================================================================

/**
 * Create hotel (Admin)
 * POST /api/v1/hotels
 */
export const createHotel = asyncHandler(async (req: Request, res: Response) => {
  const {
    partnerId,
    name,
    type,
    starRating,
    address,
    city,
    state,
    country,
    pincode,
    latitude,
    longitude,
    phone,
    email,
    amenities,
    images,
    checkInTime,
    checkOutTime,
  } = req.body;

  const hotel = await prisma.hotel.create({
    data: {
      partnerId,
      name,
      type,
      starRating,
      address,
      city,
      state,
      country,
      pincode,
      latitude,
      longitude,
      phone,
      email,
      amenities,
      images,
      checkInTime,
      checkOutTime,
      status: HotelStatus.ACTIVE,
    },
  });

  logger.info(`Hotel created: ${name}`);

  res.status(201).json({
    success: true,
    message: 'Hotel created',
    data: hotel,
  });
});

/**
 * Create room (Admin)
 * POST /api/v1/hotels/rooms
 */
export const createRoom = asyncHandler(async (req: Request, res: Response) => {
  const {
    hotelId,
    roomType,
    roomCategory,
    roomSize,
    maxAdults,
    maxChildren,
    maxOccupancy,
    bedType,
    amenities,
    images,
    totalRooms,
    basePrice,
  } = req.body;

  const room = await prisma.room.create({
    data: {
      hotelId,
      roomType,
      roomCategory,
      roomSize,
      maxAdults,
      maxChildren,
      maxOccupancy,
      bedType,
      amenities,
      images,
      totalRooms,
      basePrice,
    },
  });

  logger.info(`Room created: ${roomCategory} for hotel ${hotelId}`);

  res.status(201).json({
    success: true,
    message: 'Room created',
    data: room,
  });
});

/**
 * Create room inventory (Admin)
 * POST /api/v1/hotels/rooms/inventory
 */
export const createRoomInventory = asyncHandler(async (req: Request, res: Response) => {
  const { roomId, date, price, availableRooms } = req.body;

  const inventory = await prisma.roomInventory.create({
    data: {
      roomId,
      date: new Date(date),
      price,
      availableRooms,
      isAvailable: true,
    },
  });

  logger.info(`Room inventory created: ${roomId} for ${date}`);

  res.status(201).json({
    success: true,
    message: 'Room inventory created',
    data: inventory,
  });
});