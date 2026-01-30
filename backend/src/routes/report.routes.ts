/**
 * REPORT ROUTES
 * Routes for admin reports and analytics
 */

import { Router } from 'express';
import {
  getSalesReport,
  getBookingReport,
  getRevenueReport,
  getUserReport,
  getCancellationReport,
} from '../controllers/report.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();

// All report routes require authentication and admin role
router.use(authenticate);
router.use(authorizeAdmin);

// ============================================================================
// REPORTS
// ============================================================================

/**
 * @route   GET /api/v1/reports/sales
 * @desc    Get sales report
 * @access  Admin
 */
router.get('/sales', getSalesReport);

/**
 * @route   GET /api/v1/reports/bookings
 * @desc    Get booking report
 * @access  Admin
 */
router.get('/bookings', getBookingReport);

/**
 * @route   GET /api/v1/reports/revenue
 * @desc    Get revenue report
 * @access  Admin
 */
router.get('/revenue', getRevenueReport);

/**
 * @route   GET /api/v1/reports/users
 * @desc    Get user report
 * @access  Admin
 */
router.get('/users', getUserReport);

/**
 * @route   GET /api/v1/reports/cancellations
 * @desc    Get cancellation report
 * @access  Admin
 */
router.get('/cancellations', getCancellationReport);

export default router;