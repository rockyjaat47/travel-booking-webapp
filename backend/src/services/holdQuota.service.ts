/**
 * HOLD QUOTA SERVICE
 * Core business logic for the 25% seat hold quota system
 * 
 * Features:
 * - Hold seats temporarily (default 30 minutes)
 * - Auto-release expired holds via cron job
 * - Enforce 25% quota limit per schedule
 * - Convert holds to bookings
 */

import { prisma } from '../server';
import { HoldStatus, ScheduleStatus } from '@prisma/client';
import { logger } from '../utils/logger';
import cron from 'node-cron';

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_HOLD_EXPIRY_MINUTES = parseInt(
  process.env.DEFAULT_HOLD_EXPIRY_MINUTES || '30'
);
const DEFAULT_HOLD_QUOTA_PERCENTAGE = parseFloat(
  process.env.DEFAULT_HOLD_QUOTA_PERCENTAGE || '25'
);

// ============================================================================
// HOLD QUOTA CALCULATIONS
// ============================================================================

/**
 * Calculate maximum allowed holds for a schedule
 * @param totalSeats - Total seats in the schedule
 * @param holdQuotaPercentage - Percentage allowed for holds (default 25%)
 */
export const calculateMaxHolds = (
  totalSeats: number,
  holdQuotaPercentage: number = DEFAULT_HOLD_QUOTA_PERCENTAGE
): number => {
  return Math.floor((totalSeats * holdQuotaPercentage) / 100);
};

/**
 * Check if hold quota is available for a schedule
 */
export const isHoldQuotaAvailable = async (
  scheduleId: string,
  requestedSeats: number,
  category: 'BUS' | 'FLIGHT'
): Promise<{ available: boolean; maxAllowed: number; currentHeld: number }> => {
  let schedule: any;
  let currentHeld = 0;
  let totalSeats = 0;

  if (category === 'BUS') {
    schedule = await prisma.busSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        route: {
          include: {
            partner: true,
          },
        },
      },
    });

    if (!schedule) {
      throw new Error('Bus schedule not found');
    }

    totalSeats = schedule.route.totalSeats;
    currentHeld = schedule.heldSeats;
  } else {
    // Flight schedule
    schedule = await prisma.flightSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        flight: {
          include: {
            partner: true,
          },
        },
      },
    });

    if (!schedule) {
      throw new Error('Flight schedule not found');
    }

    // For flights, we need to check specific cabin class
    totalSeats = schedule.economySeats; // Default to economy
    currentHeld = schedule.economyBooked; // This should be tracked per class
  }

  // Check if hold quota is enabled for this partner
  const partner = schedule.route?.partner || schedule.flight?.partner;
  if (!partner?.holdQuotaEnabled) {
    return { available: false, maxAllowed: 0, currentHeld: 0 };
  }

  const holdQuotaPercentage = partner.holdQuotaPercentage || DEFAULT_HOLD_QUOTA_PERCENTAGE;
  const maxAllowed = calculateMaxHolds(totalSeats, Number(holdQuotaPercentage));

  return {
    available: currentHeld + requestedSeats <= maxAllowed,
    maxAllowed,
    currentHeld,
  };
};

// ============================================================================
// SEAT HOLD OPERATIONS
// ============================================================================

export interface HoldSeatsParams {
  scheduleId: string;
  seatNumbers: string[];
  heldBy: string; // User ID or session ID
  category: 'BUS' | 'FLIGHT';
  holdExpiryMinutes?: number;
}

export interface HoldResult {
  success: boolean;
  holdId?: string;
  seatNumbers: string[];
  holdExpiry: Date;
  message: string;
}

/**
 * Hold seats for a user
 */
export const holdSeats = async (params: HoldSeatsParams): Promise<HoldResult> => {
  const {
    scheduleId,
    seatNumbers,
    heldBy,
    category,
    holdExpiryMinutes = DEFAULT_HOLD_EXPIRY_MINUTES,
  } = params;

  try {
    // Check if hold quota is available
    const quotaCheck = await isHoldQuotaAvailable(scheduleId, seatNumbers.length, category);
    
    if (!quotaCheck.available) {
      return {
        success: false,
        seatNumbers,
        holdExpiry: new Date(),
        message: `Hold quota exceeded. Max allowed: ${quotaCheck.maxAllowed}, Currently held: ${quotaCheck.currentHeld}`,
      };
    }

    // Calculate hold expiry time
    const holdExpiry = new Date();
    holdExpiry.setMinutes(holdExpiry.getMinutes() + holdExpiryMinutes);

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      if (category === 'BUS') {
        // Check if seats are available
        const schedule = await tx.busSchedule.findUnique({
          where: { id: scheduleId },
        });

        if (!schedule || schedule.status !== ScheduleStatus.ACTIVE) {
          throw new Error('Schedule not available');
        }

        // Check seat availability from seatStatus JSON
        const seatStatus = schedule.seatStatus as Record<string, string>;
        for (const seat of seatNumbers) {
          if (seatStatus[seat] !== 'AVAILABLE') {
            throw new Error(`Seat ${seat} is not available`);
          }
        }

        // Update seat status
        const newSeatStatus = { ...seatStatus };
        for (const seat of seatNumbers) {
          newSeatStatus[seat] = 'HELD';
        }

        // Update schedule
        await tx.busSchedule.update({
          where: { id: scheduleId },
          data: {
            seatStatus: newSeatStatus,
            heldSeats: { increment: seatNumbers.length },
            availableSeats: { decrement: seatNumbers.length },
          },
        });

        // Create hold record
        const hold = await tx.seatHold.create({
          data: {
            scheduleId,
            seatNumbers,
            heldBy,
            holdExpiry,
            status: HoldStatus.ACTIVE,
          },
        });

        return hold;
      }

      // TODO: Implement flight seat hold logic
      throw new Error('Flight seat hold not implemented yet');
    });

    logger.info(`Seats held: ${seatNumbers.join(', ')} for schedule ${scheduleId}`);

    return {
      success: true,
      holdId: result.id,
      seatNumbers,
      holdExpiry,
      message: 'Seats held successfully',
    };
  } catch (error: any) {
    logger.error('Failed to hold seats:', error);
    return {
      success: false,
      seatNumbers,
      holdExpiry: new Date(),
      message: error.message || 'Failed to hold seats',
    };
  }
};

/**
 * Release held seats
 */
export const releaseHold = async (
  holdId: string,
  reason: 'EXPIRED' | 'USER_CANCELLED' | 'CONVERTED' = 'USER_CANCELLED'
): Promise<boolean> => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get hold record
      const hold = await tx.seatHold.findUnique({
        where: { id: holdId },
        include: {
          schedule: true,
        },
      });

      if (!hold || hold.status !== HoldStatus.ACTIVE) {
        throw new Error('Hold not found or already released');
      }

      // Update seat status
      const schedule = await tx.busSchedule.findUnique({
        where: { id: hold.scheduleId },
      });

      if (schedule) {
        const seatStatus = schedule.seatStatus as Record<string, string>;
        const newSeatStatus = { ...seatStatus };

        for (const seat of hold.seatNumbers) {
          if (newSeatStatus[seat] === 'HELD') {
            newSeatStatus[seat] = 'AVAILABLE';
          }
        }

        // Update schedule
        await tx.busSchedule.update({
          where: { id: hold.scheduleId },
          data: {
            seatStatus: newSeatStatus,
            heldSeats: { decrement: hold.seatNumbers.length },
            availableSeats: { increment: hold.seatNumbers.length },
          },
        });
      }

      // Update hold record
      const updatedHold = await tx.seatHold.update({
        where: { id: holdId },
        data: {
          status: reason === 'CONVERTED' ? HoldStatus.CONVERTED : HoldStatus.RELEASED,
          releasedAt: new Date(),
        },
      });

      return updatedHold;
    });

    logger.info(`Hold released: ${holdId}, reason: ${reason}`);
    return true;
  } catch (error) {
    logger.error('Failed to release hold:', error);
    return false;
  }
};

/**
 * Convert hold to booking
 */
export const convertHoldToBooking = async (
  holdId: string,
  bookingId: string
): Promise<boolean> => {
  try {
    await prisma.$transaction(async (tx) => {
      const hold = await tx.seatHold.findUnique({
        where: { id: holdId },
      });

      if (!hold || hold.status !== HoldStatus.ACTIVE) {
        throw new Error('Hold not found or not active');
      }

      // Update hold status to converted
      await tx.seatHold.update({
        where: { id: holdId },
        data: {
          status: HoldStatus.CONVERTED,
          releasedAt: new Date(),
        },
      });

      // Update seat status to booked
      const schedule = await tx.busSchedule.findUnique({
        where: { id: hold.scheduleId },
      });

      if (schedule) {
        const seatStatus = schedule.seatStatus as Record<string, string>;
        const newSeatStatus = { ...seatStatus };

        for (const seat of hold.seatNumbers) {
          newSeatStatus[seat] = 'BOOKED';
        }

        await tx.busSchedule.update({
          where: { id: hold.scheduleId },
          data: {
            seatStatus: newSeatStatus,
            heldSeats: { decrement: hold.seatNumbers.length },
            bookedSeats: { increment: hold.seatNumbers.length },
          },
        });
      }
    });

    logger.info(`Hold converted to booking: ${holdId} -> ${bookingId}`);
    return true;
  } catch (error) {
    logger.error('Failed to convert hold to booking:', error);
    return false;
  }
};

// ============================================================================
// CRON JOB - AUTO RELEASE EXPIRED HOLDS
// ============================================================================

/**
 * Release all expired holds
 * Runs every 5 minutes
 */
export const releaseExpiredHolds = async (): Promise<number> => {
  try {
    const expiredHolds = await prisma.seatHold.findMany({
      where: {
        status: HoldStatus.ACTIVE,
        holdExpiry: { lt: new Date() },
      },
    });

    let releasedCount = 0;

    for (const hold of expiredHolds) {
      const success = await releaseHold(hold.id, 'EXPIRED');
      if (success) {
        releasedCount++;
      }
    }

    if (releasedCount > 0) {
      logger.info(`Released ${releasedCount} expired holds`);
    }

    return releasedCount;
  } catch (error) {
    logger.error('Error releasing expired holds:', error);
    return 0;
  }
};

/**
 * Start the cron job for releasing expired holds
 * Runs every 5 minutes
 */
export const startHoldExpiryCron = (): void => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    logger.debug('Running hold expiry cron job...');
    await releaseExpiredHolds();
  });

  logger.info('Hold expiry cron job scheduled (every 5 minutes)');
};

// ============================================================================
// HOLD QUOTA ADMIN FUNCTIONS
// ============================================================================

/**
 * Get hold quota status for a schedule
 */
export const getHoldQuotaStatus = async (
  scheduleId: string,
  category: 'BUS' | 'FLIGHT'
) => {
  if (category === 'BUS') {
    const schedule = await prisma.busSchedule.findUnique({
      where: { id: scheduleId },
      include: {
        route: {
          include: {
            partner: true,
          },
        },
        holds: {
          where: { status: HoldStatus.ACTIVE },
        },
      },
    });

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    const partner = schedule.route.partner;
    const totalSeats = schedule.route.totalSeats;
    const holdQuotaPercentage = Number(partner.holdQuotaPercentage || DEFAULT_HOLD_QUOTA_PERCENTAGE);
    const maxHolds = calculateMaxHolds(totalSeats, holdQuotaPercentage);

    return {
      scheduleId,
      category,
      totalSeats,
      holdQuotaEnabled: partner.holdQuotaEnabled,
      holdQuotaPercentage,
      maxHoldsAllowed: maxHolds,
      currentHolds: schedule.heldSeats,
      availableHolds: Math.max(0, maxHolds - schedule.heldSeats),
      activeHoldRecords: schedule.holds.length,
      holdExpiryMinutes: partner.holdExpiryMinutes || DEFAULT_HOLD_EXPIRY_MINUTES,
    };
  }

  // TODO: Flight hold quota status
  throw new Error('Flight hold quota status not implemented yet');
};

/**
 * Update partner hold quota settings
 */
export const updatePartnerHoldQuota = async (
  partnerId: string,
  settings: {
    holdQuotaEnabled?: boolean;
    holdQuotaPercentage?: number;
    holdExpiryMinutes?: number;
  }
) => {
  const partner = await prisma.partner.update({
    where: { id: partnerId },
    data: settings,
  });

  logger.info(`Updated hold quota settings for partner ${partnerId}`);

  return partner;
};