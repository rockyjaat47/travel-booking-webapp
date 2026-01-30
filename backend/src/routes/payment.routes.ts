/**
 * PAYMENT ROUTES
 * Routes for payment operations
 */

import { Router } from 'express';
import {
  createOrder,
  verifyPayment,
  getWallet,
  addMoneyToWallet,
  verifyWalletTopup,
  handleWebhook,
} from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// ============================================================================
// WEBHOOK (PUBLIC)
// ============================================================================

/**
 * @route   POST /api/v1/payments/webhook
 * @desc    Handle Razorpay webhooks
 * @access  Public (Webhook)
 */
router.post('/webhook', handleWebhook);

// ============================================================================
// PROTECTED ROUTES
// ============================================================================

router.use(authenticate);

/**
 * @route   POST /api/v1/payments/create-order
 * @desc    Create Razorpay order
 * @access  Private
 */
router.post('/create-order', createOrder);

/**
 * @route   POST /api/v1/payments/verify
 * @desc    Verify Razorpay payment
 * @access  Private
 */
router.post('/verify', verifyPayment);

/**
 * @route   GET /api/v1/payments/wallet
 * @desc    Get wallet balance
 * @access  Private
 */
router.get('/wallet', getWallet);

/**
 * @route   POST /api/v1/payments/wallet/add
 * @desc    Add money to wallet
 * @access  Private
 */
router.post('/wallet/add', addMoneyToWallet);

/**
 * @route   POST /api/v1/payments/wallet/verify
 * @desc    Verify wallet top-up
 * @access  Private
 */
router.post('/wallet/verify', verifyWalletTopup);

export default router;