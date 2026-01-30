/**
 * USER ROUTES
 * Routes for user profile operations
 */

import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  submitKyc,
  getPassengers,
  addPassenger,
  updatePassenger,
  deletePassenger,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================================================
// PROFILE
// ============================================================================

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', getProfile);

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', updateProfile);

/**
 * @route   PUT /api/v1/users/change-password
 * @desc    Change password
 * @access  Private
 */
router.put('/change-password', changePassword);

// ============================================================================
// KYC
// ============================================================================

/**
 * @route   POST /api/v1/users/kyc
 * @desc    Submit KYC documents
 * @access  Private
 */
router.post('/kyc', submitKyc);

// ============================================================================
// PASSENGERS
// ============================================================================

/**
 * @route   GET /api/v1/users/passengers
 * @desc    Get saved passengers
 * @access  Private
 */
router.get('/passengers', getPassengers);

/**
 * @route   POST /api/v1/users/passengers
 * @desc    Add passenger
 * @access  Private
 */
router.post('/passengers', addPassenger);

/**
 * @route   PUT /api/v1/users/passengers/:id
 * @desc    Update passenger
 * @access  Private
 */
router.put('/passengers/:id', updatePassenger);

/**
 * @route   DELETE /api/v1/users/passengers/:id
 * @desc    Delete passenger
 * @access  Private
 */
router.delete('/passengers/:id', deletePassenger);

export default router;