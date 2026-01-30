/**
 * BOOKING ROUTES
 * Routes for booking operations
 */

import { Router } from 'express';
import { body } from 'express-validator';
import {
  createBooking,
  getUserBookings,
  getBookingById,
  confirmBookingHandler,
  cancelBookingHandler,
  getCancellationDetails,
  downloadTicket,
} from '../controllers/booking.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const createBookingValidation = [
  body('category')
    .isIn(['BUS', 'AIRLINE', 'HOTEL'])
    .withMessage('Category must be BUS, AIRLINE, or HOTEL'),
  body('passengers')
    .isArray({ min: 1 })
    .withMessage('At least one passenger is required'),
  body('passengers.*.firstName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Passenger first name is required'),
  body('passengers.*.lastName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Passenger last name is required'),
  body('primaryPassengerName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Primary passenger name is required'),
];

const cancelBookingValidation = [
  body('reason')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Cancellation reason is required (min 5 characters)'),
];

const confirmBookingValidation = [
  body('paymentMethod')
    .isIn(['razorpay', 'wallet', 'upi', 'card'])
    .withMessage('Valid payment method is required'),
  body('paidAmount')
    .isNumeric()
    .withMessage('Paid amount is required'),
];

// ============================================================================
// ROUTES
// ============================================================================

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/bookings
 * @desc    Create new booking
 * @access  Private
 */
router.post('/', createBookingValidation, createBooking);

/**
 * @route   GET /api/v1/bookings
 * @desc    Get user's bookings
 * @access  Private
 */
router.get('/', getUserBookings);

/**
 * @route   GET /api/v1/bookings/:id
 * @desc    Get booking by ID
 * @access  Private
 */
router.get('/:id', getBookingById);

/**
 * @route   PATCH /api/v1/bookings/:id/confirm
 * @desc    Confirm booking after payment
 * @access  Private
 */
router.patch('/:id/confirm', confirmBookingValidation, confirmBookingHandler);

/**
 * @route   POST /api/v1/bookings/:id/cancel
 * @desc    Cancel booking
 * @access  Private
 */
router.post('/:id/cancel', cancelBookingValidation, cancelBookingHandler);

/**
 * @route   GET /api/v1/bookings/:id/cancellation-details
 * @desc    Get cancellation details
 * @access  Private
 */
router.get('/:id/cancellation-details', getCancellationDetails);

/**
 * @route   GET /api/v1/bookings/:id/ticket
 * @desc    Download booking ticket
 * @access  Private
 */
router.get('/:id/ticket', downloadTicket);

export default router;