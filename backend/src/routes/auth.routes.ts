/**
 * AUTHENTICATION ROUTES
 * Routes for user authentication and authorization
 */

import { Router } from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  sendOtp,
  verifyOtp,
  refreshToken,
  logout,
  logoutAll,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('phone')
    .matches(/^(\+91)?[6-9]\d{9}$/)
    .withMessage('Valid Indian phone number is required'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be 2-50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be 2-50 characters'),
];

const loginValidation = [
  body('loginMethod')
    .isIn(['password', 'otp'])
    .withMessage('Login method must be "password" or "otp"'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('phone')
    .optional()
    .matches(/^(\+91)?[6-9]\d{9}$/)
    .withMessage('Valid Indian phone number is required'),
  body('password')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Password is required'),
  body('otp')
    .optional()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be 6 digits'),
];

const otpValidation = [
  body('phone')
    .matches(/^(\+91)?[6-9]\d{9}$/)
    .withMessage('Valid Indian phone number is required'),
  body('purpose')
    .isIn(['LOGIN', 'SIGNUP', 'PASSWORD_RESET'])
    .withMessage('Purpose must be LOGIN, SIGNUP, or PASSWORD_RESET'),
];

const otpVerifyValidation = [
  body('phone')
    .matches(/^(\+91)?[6-9]\d{9}$/)
    .withMessage('Valid Indian phone number is required'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be 6 digits'),
  body('purpose')
    .isIn(['LOGIN', 'SIGNUP', 'PASSWORD_RESET'])
    .withMessage('Purpose must be LOGIN, SIGNUP, or PASSWORD_RESET'),
];

// ============================================================================
// ROUTES
// ============================================================================

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', registerValidation, register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user (password or OTP)
 * @access  Public
 */
router.post('/login', loginValidation, login);

/**
 * @route   POST /api/v1/auth/otp/send
 * @desc    Send OTP to phone
 * @access  Public
 */
router.post('/otp/send', otpValidation, sendOtp);

/**
 * @route   POST /api/v1/auth/otp/verify
 * @desc    Verify OTP
 * @access  Public
 */
router.post('/otp/verify', otpVerifyValidation, verifyOtp);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', refreshToken);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, logout);

/**
 * @route   POST /api/v1/auth/logout-all
 * @desc    Logout from all devices
 * @access  Private
 */
router.post('/logout-all', authenticate, logoutAll);

export default router;