/**
 * ADMIN ROUTES
 * Routes for admin operations
 */

import { Router } from 'express';
import { body } from 'express-validator';
import {
  getDashboardStats,
  getUsers,
  getUserById,
  updateUserStatus,
  createAdminUser,
  getPartners,
  createPartner,
  updatePartner,
  updatePartnerHoldQuota,
  getAllBookings,
  updateBookingStatus,
  getCancellationRequests,
  processCancellation,
} from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorizeAdmin);

// ============================================================================
// DASHBOARD
// ============================================================================

/**
 * @route   GET /api/v1/admin/dashboard
 * @desc    Get dashboard statistics
 * @access  Admin
 */
router.get('/dashboard', getDashboardStats);

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users
 * @access  Admin
 */
router.get('/users', getUsers);

/**
 * @route   GET /api/v1/admin/users/:id
 * @desc    Get user by ID
 * @access  Admin
 */
router.get('/users/:id', getUserById);

/**
 * @route   PATCH /api/v1/admin/users/:id/status
 * @desc    Update user status
 * @access  Admin
 */
router.patch('/users/:id/status', updateUserStatus);

/**
 * @route   POST /api/v1/admin/users/create-admin
 * @desc    Create admin user
 * @access  Super Admin
 */
router.post('/users/create-admin', [
  body('email').isEmail().normalizeEmail(),
  body('phone').matches(/^(\+91)?[6-9]\d{9}$/),
  body('password').isLength({ min: 8 }),
  body('firstName').trim().isLength({ min: 2 }),
  body('lastName').trim().isLength({ min: 2 }),
], createAdminUser);

// ============================================================================
// PARTNER MANAGEMENT
// ============================================================================

/**
 * @route   GET /api/v1/admin/partners
 * @desc    Get all partners
 * @access  Admin
 */
router.get('/partners', getPartners);

/**
 * @route   POST /api/v1/admin/partners
 * @desc    Create partner
 * @access  Admin
 */
router.post('/partners', [
  body('name').trim().isLength({ min: 2 }),
  body('type').isIn(['BUS_OPERATOR', 'AIRLINE', 'HOTEL_CHAIN', 'INDIVIDUAL_HOTEL']),
  body('email').isEmail(),
  body('phone').matches(/^(\+91)?[6-9]\d{9}$/),
], createPartner);

/**
 * @route   PATCH /api/v1/admin/partners/:id
 * @desc    Update partner
 * @access  Admin
 */
router.patch('/partners/:id', updatePartner);

/**
 * @route   PATCH /api/v1/admin/partners/:id/hold-quota
 * @desc    Update partner hold quota settings
 * @access  Admin
 */
router.patch('/partners/:id/hold-quota', [
  body('holdQuotaEnabled').isBoolean().optional(),
  body('holdQuotaPercentage').isFloat({ min: 0, max: 100 }).optional(),
  body('holdExpiryMinutes').isInt({ min: 5 }).optional(),
], updatePartnerHoldQuota);

// ============================================================================
// BOOKING MANAGEMENT
// ============================================================================

/**
 * @route   GET /api/v1/admin/bookings
 * @desc    Get all bookings
 * @access  Admin
 */
router.get('/bookings', getAllBookings);

/**
 * @route   PATCH /api/v1/admin/bookings/:id/status
 * @desc    Update booking status
 * @access  Admin
 */
router.patch('/bookings/:id/status', [
  body('status').isIn(['PENDING', 'ON_HOLD', 'CONFIRMED', 'CANCELLED', 'NO_SHOW', 'COMPLETED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED']),
], updateBookingStatus);

// ============================================================================
// CANCELLATION MANAGEMENT
// ============================================================================

/**
 * @route   GET /api/v1/admin/cancellations
 * @desc    Get cancellation requests
 * @access  Admin
 */
router.get('/cancellations', getCancellationRequests);

/**
 * @route   POST /api/v1/admin/cancellations/:id/process
 * @desc    Process cancellation request
 * @access  Admin
 */
router.post('/cancellations/:id/process', [
  body('action').isIn(['APPROVE', 'REJECT']),
], processCancellation);

export default router;