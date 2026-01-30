/**
 * FLIGHT ROUTES
 * Routes for flight operations
 */

import { Router } from 'express';
import {
  searchFlights,
  getScheduleDetails,
  getFareRules,
  createFlight,
  createSchedule,
  createFareRules,
} from '../controllers/flight.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

/**
 * @route   GET /api/v1/flights/search
 * @desc    Search available flights
 * @access  Public
 */
router.get('/search', searchFlights);

/**
 * @route   GET /api/v1/flights/schedules/:id
 * @desc    Get flight schedule details
 * @access  Public
 */
router.get('/schedules/:id', getScheduleDetails);

/**
 * @route   GET /api/v1/flights/schedules/:id/fare-rules
 * @desc    Get fare rules for a schedule
 * @access  Public
 */
router.get('/schedules/:id/fare-rules', getFareRules);

// ============================================================================
// ADMIN ROUTES
// ============================================================================

/**
 * @route   POST /api/v1/flights
 * @desc    Create flight
 * @access  Admin
 */
router.post('/', authenticate, authorizeAdmin, createFlight);

/**
 * @route   POST /api/v1/flights/schedules
 * @desc    Create flight schedule
 * @access  Admin
 */
router.post('/schedules', authenticate, authorizeAdmin, createSchedule);

/**
 * @route   POST /api/v1/flights/fare-rules
 * @desc    Create fare rules
 * @access  Admin
 */
router.post('/fare-rules', authenticate, authorizeAdmin, createFareRules);

export default router;