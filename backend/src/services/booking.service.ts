/**
 * BOOKING SERVICE
 * Core business logic for booking operations
 * 
 * Features:
 * - Create bookings for Bus, Flight, Hotel
 * - Calculate pricing with taxes and fees
 * - Apply add-ons
 * - Manage booking lifecycle
 * - Handle cancellations and refunds
 */

import { prisma } from '../server';
import {
  BookingCategory,
  BookingStatus,
  PaymentStatus,
  HoldStatus,
  CabinClass,
} from '@prisma/client';
import {
  CreateBookingRequest,
  BookingResponse,
  CancellationRequest,
  CancellationResponse,
} from '../types';
import { holdSeats, releaseHold, convertHoldToBooking } from './holdQuota.service';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONVENIENCE_FEE_PERCENTAGE = 2; // 2% convenience fee
const GST_PERCENTAGE = 5; // 5% GST on convenience fee

// ============================================================================
// BOOKING NUMBER GENERATION
// ============================================================================

/**
 * Generate unique booking number
 * Format: LT-{CATEGORY}-{YYYYMMDD}-{RANDOM}
 */
export const generateBookingNumber = (category: BookingCategory): string => {
  const prefix = 'LT';
  const catCode = category.substring(0, 3).toUpperCase();
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${catCode}-${date}-${random}`;
};

// ============================================================================
// PRICING CALCULATIONS
// ============================================================================

export interface PricingBreakdown {
  baseAmount: number;
  taxAmount: number;
  convenienceFee: number;
  gstOnConvenience: number;
  discountAmount: number;
  addOnAmount: number;
  totalAmount: number;
}

/**
 * Calculate booking pricing
 */
export const calculatePricing = (
  baseFare: number,
  passengerCount: number,
  addOns: Array<{ price: number; quantity: number }> = [],
  discountCode?: string
): PricingBreakdown => {
  // Base amount
  const baseAmount = baseFare * passengerCount;

  // Calculate add-ons
  const addOnAmount = addOns.reduce(
    (sum, addon) => sum + addon.price * addon.quantity,
    0
  );

  // Convenience fee (2% of base amount)
  const convenienceFee = (baseAmount * CONVENIENCE_FEE_PERCENTAGE) / 100;

  // GST on convenience fee (5%)
  const gstOnConvenience = (convenienceFee * GST_PERCENTAGE) / 100;

  // Tax amount (GST on convenience fee)
  const taxAmount = gstOnConvenience;

  // Discount (if applicable)
  let discountAmount = 0;
  if (discountCode) {
    // TODO: Implement coupon/discount logic
    discountAmount = 0;
  }

  // Total amount
  const totalAmount =
    baseAmount +
    taxAmount +
    convenienceFee +
    addOnAmount -
    discountAmount;

  return {
    baseAmount,
    taxAmount,
    convenienceFee,
    gstOnConvenience,
    discountAmount,
    addOnAmount,
    totalAmount: Math.round(totalAmount * 100) / 100,
  };
};

// ============================================================================
// BUS BOOKING
// ============================================================================

/**
 * Create bus booking
 */
export const createBusBooking = async (
  userId: string,
  data: CreateBookingRequest
): Promise<BookingResponse> => {
  const { busScheduleId, passengers, addOns, couponCode } = data;

  if (!busScheduleId) {
    throw new Error('Bus schedule ID is required');
  }

  return await prisma.$transaction(async (tx) => {
    // Get schedule with route details
    const schedule = await tx.busSchedule.findUnique({
      where: { id: busScheduleId },
      include: {
        route: true,
      },
    });

    if (!schedule || schedule.status !== 'ACTIVE') {
      throw new Error('Bus schedule not available');
    }

    if (schedule.availableSeats < passengers.length) {
      throw new Error('Not enough seats available');
    }

    // Check seat availability
    const seatStatus = schedule.seatStatus as Record<string, string>;
    const requestedSeats = passengers.map((p) => p.seatNumber).filter(Boolean) as string[];

    for (const seat of requestedSeats) {
      if (seat && seatStatus[seat] !== 'AVAILABLE') {
        throw new Error(`Seat ${seat} is not available`);
      }
    }

    // Calculate pricing
    const addOnItems = addOns?.map((a) => ({ price: a.price, quantity: a.quantity })) || [];
    const pricing = calculatePricing(
      Number(schedule.baseFare),
      passengers.length,
      addOnItems,
      couponCode
    );

    // Generate booking number
    const bookingNumber = generateBookingNumber(BookingCategory.BUS);

    // Create booking
    const booking = await tx.booking.create({
      data: {
        bookingNumber,
        userId,
        category: BookingCategory.BUS,
        busScheduleId,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        primaryPassengerName: `${passengers[0].firstName} ${passengers[0].lastName}`,
        primaryPassengerPhone: passengers[0].phone,
        primaryPassengerEmail: passengers[0].email,
        baseAmount: pricing.baseAmount,
        taxAmount: pricing.taxAmount,
        convenienceFee: pricing.convenienceFee,
        discountAmount: pricing.discountAmount,
        addOnAmount: pricing.addOnAmount,
        totalAmount: pricing.totalAmount,
        addOns: addOns ? JSON.stringify(addOns) : null,
      },
    });

    // Create passenger records
    await tx.bookingPassenger.createMany({
      data: passengers.map((p) => ({
        bookingId: booking.id,
        firstName: p.firstName,
        lastName: p.lastName,
        dateOfBirth: p.dateOfBirth,
        gender: p.gender,
        phone: p.phone,
        email: p.email,
        seatNumber: p.seatNumber,
        seatPreference: p.seatPreference,
        idType: p.idType,
        idNumber: p.idNumber,
      })),
    });

    // Hold seats temporarily (10 minutes for payment)
    if (requestedSeats.length > 0) {
      const holdResult = await holdSeats({
        scheduleId: busScheduleId,
        seatNumbers: requestedSeats,
        heldBy: userId,
        category: 'BUS',
        holdExpiryMinutes: 10, // 10 minutes for payment
      });

      if (!holdResult.success) {
        throw new Error(holdResult.message);
      }
    }

    logger.info(`Bus booking created: ${bookingNumber}`);

    return {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      category: booking.category,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      baseAmount: Number(booking.baseAmount),
      taxAmount: Number(booking.taxAmount),
      convenienceFee: Number(booking.convenienceFee),
      discountAmount: Number(booking.discountAmount),
      totalAmount: Number(booking.totalAmount),
      paidAmount: Number(booking.paidAmount),
      createdAt: booking.createdAt,
    };
  });
};

// ============================================================================
// FLIGHT BOOKING
// ============================================================================

/**
 * Create flight booking
 */
export const createFlightBooking = async (
  userId: string,
  data: CreateBookingRequest
): Promise<BookingResponse> => {
  const { flightScheduleId, cabinClass, passengers, addOns, couponCode } = data;

  if (!flightScheduleId) {
    throw new Error('Flight schedule ID is required');
  }

  return await prisma.$transaction(async (tx) => {
    // Get schedule with flight details
    const schedule = await tx.flightSchedule.findUnique({
      where: { id: flightScheduleId },
      include: {
        flight: true,
        fareRules: true,
      },
    });

    if (!schedule || schedule.status !== 'ACTIVE') {
      throw new Error('Flight schedule not available');
    }

    // Determine fare based on cabin class
    let baseFare: number;
    let availableSeats: number;

    switch (cabinClass) {
      case 'PREMIUM_ECONOMY':
        baseFare = Number(schedule.premiumFare);
        availableSeats = schedule.premiumSeats - schedule.premiumBooked;
        break;
      case 'BUSINESS':
        baseFare = Number(schedule.businessFare);
        availableSeats = schedule.businessSeats - schedule.businessBooked;
        break;
      case 'FIRST':
        baseFare = Number(schedule.firstFare);
        availableSeats = schedule.firstSeats - schedule.firstBooked;
        break;
      default:
        baseFare = Number(schedule.economyFare);
        availableSeats = schedule.economySeats - schedule.economyBooked;
    }

    if (!baseFare || availableSeats < passengers.length) {
      throw new Error('Not enough seats available in selected cabin class');
    }

    // Calculate pricing
    const addOnItems = addOns?.map((a) => ({ price: a.price, quantity: a.quantity })) || [];
    const pricing = calculatePricing(baseFare, passengers.length, addOnItems, couponCode);

    // Generate booking number
    const bookingNumber = generateBookingNumber(BookingCategory.AIRLINE);

    // Create booking
    const booking = await tx.booking.create({
      data: {
        bookingNumber,
        userId,
        category: BookingCategory.AIRLINE,
        flightScheduleId,
        cabinClass: cabinClass || 'ECONOMY',
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        primaryPassengerName: `${passengers[0].firstName} ${passengers[0].lastName}`,
        primaryPassengerPhone: passengers[0].phone,
        primaryPassengerEmail: passengers[0].email,
        baseAmount: pricing.baseAmount,
        taxAmount: pricing.taxAmount,
        convenienceFee: pricing.convenienceFee,
        discountAmount: pricing.discountAmount,
        addOnAmount: pricing.addOnAmount,
        totalAmount: pricing.totalAmount,
        addOns: addOns ? JSON.stringify(addOns) : null,
      },
    });

    // Create passenger records
    await tx.bookingPassenger.createMany({
      data: passengers.map((p) => ({
        bookingId: booking.id,
        firstName: p.firstName,
        lastName: p.lastName,
        dateOfBirth: p.dateOfBirth,
        gender: p.gender,
        phone: p.phone,
        email: p.email,
        seatNumber: p.seatNumber,
        seatPreference: p.seatPreference,
        mealPreference: p.mealPreference,
        specialAssistance: p.specialAssistance,
        idType: p.idType,
        idNumber: p.idNumber,
      })),
    });

    // Update seat availability
    const cabinClassField = `${cabinClass?.toLowerCase() || 'economy'}Booked`;
    await tx.flightSchedule.update({
      where: { id: flightScheduleId },
      data: {
        [cabinClassField]: { increment: passengers.length },
      },
    });

    logger.info(`Flight booking created: ${bookingNumber}`);

    return {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      category: booking.category,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      baseAmount: Number(booking.baseAmount),
      taxAmount: Number(booking.taxAmount),
      convenienceFee: Number(booking.convenienceFee),
      discountAmount: Number(booking.discountAmount),
      totalAmount: Number(booking.totalAmount),
      paidAmount: Number(booking.paidAmount),
      createdAt: booking.createdAt,
    };
  });
};

// ============================================================================
// HOTEL BOOKING
// ============================================================================

/**
 * Create hotel booking
 */
export const createHotelBooking = async (
  userId: string,
  data: CreateBookingRequest
): Promise<BookingResponse> => {
  const { roomInventoryId, checkInDate, checkOutDate, nights, passengers, addOns, couponCode } = data;

  if (!roomInventoryId || !checkInDate || !checkOutDate || !nights) {
    throw new Error('Room inventory ID, check-in, check-out dates, and nights are required');
  }

  return await prisma.$transaction(async (tx) => {
    // Get room inventory
    const inventory = await tx.roomInventory.findUnique({
      where: { id: roomInventoryId },
      include: {
        room: true,
      },
    });

    if (!inventory || !inventory.isAvailable || inventory.availableRooms < 1) {
      throw new Error('Room not available for selected dates');
    }

    // Calculate pricing
    const addOnItems = addOns?.map((a) => ({ price: a.price, quantity: a.quantity })) || [];
    const pricing = calculatePricing(
      Number(inventory.price),
      nights,
      addOnItems,
      couponCode
    );

    // Generate booking number
    const bookingNumber = generateBookingNumber(BookingCategory.HOTEL);

    // Create booking
    const booking = await tx.booking.create({
      data: {
        bookingNumber,
        userId,
        category: BookingCategory.HOTEL,
        roomInventoryId,
        checkInDate,
        checkOutDate,
        nights,
        status: BookingStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        primaryPassengerName: `${passengers[0].firstName} ${passengers[0].lastName}`,
        primaryPassengerPhone: passengers[0].phone,
        primaryPassengerEmail: passengers[0].email,
        baseAmount: pricing.baseAmount,
        taxAmount: pricing.taxAmount,
        convenienceFee: pricing.convenienceFee,
        discountAmount: pricing.discountAmount,
        addOnAmount: pricing.addOnAmount,
        totalAmount: pricing.totalAmount,
        addOns: addOns ? JSON.stringify(addOns) : null,
      },
    });

    // Create guest records
    await tx.bookingPassenger.createMany({
      data: passengers.map((p, index) => ({
        bookingId: booking.id,
        firstName: p.firstName,
        lastName: p.lastName,
        guestType: index === 0 ? 'ADULT' : 'CHILD',
        phone: p.phone,
        email: p.email,
      })),
    });

    // Update room availability
    await tx.roomInventory.update({
      where: { id: roomInventoryId },
      data: {
        availableRooms: { decrement: 1 },
        heldRooms: { increment: 1 },
      },
    });

    logger.info(`Hotel booking created: ${bookingNumber}`);

    return {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      category: booking.category,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      baseAmount: Number(booking.baseAmount),
      taxAmount: Number(booking.taxAmount),
      convenienceFee: Number(booking.convenienceFee),
      discountAmount: Number(booking.discountAmount),
      totalAmount: Number(booking.totalAmount),
      paidAmount: Number(booking.paidAmount),
      createdAt: booking.createdAt,
    };
  });
};

// ============================================================================
// CONFIRM BOOKING
// ============================================================================

/**
 * Confirm booking after payment
 */
export const confirmBooking = async (
  bookingId: string,
  paymentDetails: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    paymentMethod: string;
    paidAmount: number;
  }
): Promise<BookingResponse> => {
  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: BookingStatus.CONFIRMED,
      paymentStatus: PaymentStatus.CAPTURED,
      paidAmount: paymentDetails.paidAmount,
      razorpayOrderId: paymentDetails.razorpayOrderId,
      razorpayPaymentId: paymentDetails.razorpayPaymentId,
      razorpaySignature: paymentDetails.razorpaySignature,
      paymentMethod: paymentDetails.paymentMethod,
      confirmedAt: new Date(),
    },
  });

  // If bus booking, convert hold to booking
  if (booking.category === BookingCategory.BUS && booking.busScheduleId) {
    // Find active hold for this user and schedule
    const hold = await prisma.seatHold.findFirst({
      where: {
        scheduleId: booking.busScheduleId,
        heldBy: booking.userId,
        status: HoldStatus.ACTIVE,
      },
    });

    if (hold) {
      await convertHoldToBooking(hold.id, bookingId);
    }
  }

  // If hotel booking, update held rooms to booked
  if (booking.category === BookingCategory.HOTEL && booking.roomInventoryId) {
    await prisma.roomInventory.update({
      where: { id: booking.roomInventoryId },
      data: {
        heldRooms: { decrement: 1 },
        bookedRooms: { increment: 1 },
      },
    });
  }

  logger.info(`Booking confirmed: ${booking.bookingNumber}`);

  return {
    id: booking.id,
    bookingNumber: booking.bookingNumber,
    category: booking.category,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    baseAmount: Number(booking.baseAmount),
    taxAmount: Number(booking.taxAmount),
    convenienceFee: Number(booking.convenienceFee),
    discountAmount: Number(booking.discountAmount),
    totalAmount: Number(booking.totalAmount),
    paidAmount: Number(booking.paidAmount),
    createdAt: booking.createdAt,
  };
};

// ============================================================================
// CANCELLATION & REFUNDS
// ============================================================================

/**
 * Calculate cancellation charges and refund amount
 */
export const calculateCancellationRefund = async (
  bookingId: string
): Promise<CancellationResponse> => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      flightSchedule: {
        include: {
          fareRules: true,
        },
      },
    },
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  const now = new Date();
  const bookingDate = booking.createdAt;
  const hoursSinceBooking = (now.getTime() - bookingDate.getTime()) / (1000 * 60 * 60);

  // Get fare rules (for flights) or default rules
  const fareRules = booking.flightSchedule?.fareRules;
  const freeCancellationHours = fareRules?.cancellationFreeWithinHours || 24;

  let cancellationCharges = 0;
  let eligibleRefundAmount = Number(booking.paidAmount);

  // Check if within free cancellation window
  if (hoursSinceBooking <= freeCancellationHours) {
    // Full refund
    cancellationCharges = 0;
  } else {
    // Apply cancellation charges
    const chargePercentage = fareRules?.cancellationChargePercentage || 0;
    const chargeFixed = fareRules?.cancellationChargeFixed || 0;

    cancellationCharges = Math.max(
      (eligibleRefundAmount * Number(chargePercentage)) / 100,
      Number(chargeFixed)
    );
  }

  const finalRefundAmount = Math.max(0, eligibleRefundAmount - cancellationCharges);

  return {
    eligibleRefundAmount,
    cancellationCharges,
    finalRefundAmount,
    refundProcessingDays: fareRules?.refundProcessingDays || 7,
  };
};

/**
 * Cancel booking
 */
export const cancelBooking = async (
  bookingId: string,
  userId: string,
  reason: string
): Promise<{ booking: BookingResponse; refund: CancellationResponse }> => {
  return await prisma.$transaction(async (tx) => {
    // Get booking
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        passengers: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.userId !== userId) {
      throw new Error('Unauthorized to cancel this booking');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new Error('Booking is already cancelled');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new Error('Cannot cancel completed booking');
    }

    // Calculate refund
    const refund = await calculateCancellationRefund(bookingId);

    // Update booking status
    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledBy: userId,
        cancellationReason: reason,
        refundAmount: refund.finalRefundAmount,
      },
    });

    // Create cancellation request record
    await tx.cancellationRequest.create({
      data: {
        bookingId,
        type: 'USER_INITIATED',
        requestedBy: userId,
        reason,
        eligibleRefundAmount: refund.eligibleRefundAmount,
        cancellationCharges: refund.cancellationCharges,
        finalRefundAmount: refund.finalRefundAmount,
        status: 'APPROVED',
        approvedBy: 'SYSTEM',
        approvedAt: new Date(),
        refundStatus: refund.finalRefundAmount > 0 ? 'PENDING' : 'COMPLETED',
      },
    });

    // Release inventory
    if (booking.category === BookingCategory.BUS && booking.busScheduleId) {
      const schedule = await tx.busSchedule.findUnique({
        where: { id: booking.busScheduleId },
      });

      if (schedule) {
        const seatStatus = schedule.seatStatus as Record<string, string>;
        const newSeatStatus = { ...seatStatus };

        for (const passenger of booking.passengers) {
          if (passenger.seatNumber) {
            newSeatStatus[passenger.seatNumber] = 'AVAILABLE';
          }
        }

        await tx.busSchedule.update({
          where: { id: booking.busScheduleId },
          data: {
            seatStatus: newSeatStatus,
            bookedSeats: { decrement: booking.passengers.length },
            availableSeats: { increment: booking.passengers.length },
          },
        });
      }
    }

    if (booking.category === BookingCategory.AIRLINE && booking.flightScheduleId) {
      const cabinClassField = `${booking.cabinClass?.toLowerCase() || 'economy'}Booked`;
      await tx.flightSchedule.update({
        where: { id: booking.flightScheduleId },
        data: {
          [cabinClassField]: { decrement: booking.passengers.length },
        },
      });
    }

    if (booking.category === BookingCategory.HOTEL && booking.roomInventoryId) {
      await tx.roomInventory.update({
        where: { id: booking.roomInventoryId },
        data: {
          bookedRooms: { decrement: 1 },
          availableRooms: { increment: 1 },
        },
      });
    }

    logger.info(`Booking cancelled: ${booking.bookingNumber}`);

    return {
      booking: {
        id: updatedBooking.id,
        bookingNumber: updatedBooking.bookingNumber,
        category: updatedBooking.category,
        status: updatedBooking.status,
        paymentStatus: updatedBooking.paymentStatus,
        baseAmount: Number(updatedBooking.baseAmount),
        taxAmount: Number(updatedBooking.taxAmount),
        convenienceFee: Number(updatedBooking.convenienceFee),
        discountAmount: Number(updatedBooking.discountAmount),
        totalAmount: Number(updatedBooking.totalAmount),
        paidAmount: Number(updatedBooking.paidAmount),
        createdAt: updatedBooking.createdAt,
      },
      refund,
    };
  });
};