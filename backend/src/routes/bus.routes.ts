/**
 * BUS ROUTES
 * Routes for bus operations
 */

import { Router } from 'express';
import {
  searchBuses,
  getScheduleDetails,
  getSeatLayout,
  createRoute,
  createSchedule,
} from '../controllers/bus.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

/**
 * @route   GET /api/v1/buses/search
 * @desc    Search available buses
 * @access  Public
 */
router.get('/search', searchBuses);

/**
 * @route   GET /api/v1/buses/schedules/:id
 * @desc    Get bus schedule details
 * @access  Public
 */
router.get('/schedules/:id', getScheduleDetails);

/**
 * @route   GET /api/v1/buses/schedules/:id/seats
 * @desc    Get seat layout with availability
 * @access  Public
 */
router.get('/schedules/:id/seats', getSeatLayout);

// ============================================================================
// ADMIN ROUTES
// ============================================================================

/**
 * @route   POST /api/v1/buses/routes
 * @desc    Create bus route
 * @access  Admin
 */
router.post('/routes', authenticate, authorizeAdmin, createRoute);

/**
 * @route   POST /api/v1/buses/schedules
 * @desc    Create bus schedule
 * @access  Admin
 */
router.post('/schedules', authenticate, authorizeAdmin, createSchedule);

export default router;