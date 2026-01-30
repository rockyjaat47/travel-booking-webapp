/**
 * PAYMENT CONTROLLER
 * HTTP request handlers for payment operations
 * Integrates with Razorpay for payment processing
 */

import { Request, Response } from 'express';
import { prisma } from '../server';
import { AuthenticatedRequest, CreatePaymentRequest, PaymentVerificationRequest } from '../types';
import { asyncHandler, BadRequestError, NotFoundError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// ============================================================================
// RAZORPAY CONFIGURATION
// ============================================================================

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_secret',
});

// ============================================================================
// CREATE PAYMENT ORDER
// ============================================================================

/**
 * Create Razorpay order
 * POST /api/v1/payments/create-order
 */
export const createOrder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }

  const { bookingId, amount, method }: CreatePaymentRequest = req.body;

  if (!bookingId || !amount || !method) {
    throw new BadRequestError('Booking ID, amount, and payment method are required');
  }

  // Get booking details
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId },
  });

  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  if (booking.status !== 'PENDING') {
    throw new BadRequestError('Payment can only be made for pending bookings');
  }

  // Validate amount
  if (Number(booking.totalAmount) !== amount) {
    throw new BadRequestError('Payment amount does not match booking total');
  }

  // Handle wallet payment
  if (method === 'wallet') {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet || Number(wallet.balance) < amount) {
      throw new BadRequestError('Insufficient wallet balance');
    }

    // Deduct from wallet
    await prisma.wallet.update({
      where: { userId },
      data: {
        balance: {
          decrement: amount,
        },
      },
    });

    // Create wallet transaction
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEBIT',
        amount,
        status: 'SUCCESS',
        description: `Payment for booking ${booking.bookingNumber}`,
        referenceId: bookingId,
        referenceType: 'BOOKING',
      },
    });

    // Update booking
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CONFIRMED',
        paymentStatus: 'CAPTURED',
        paidAmount: amount,
        paymentMethod: 'wallet',
        confirmedAt: new Date(),
      },
    });

    logger.info(`Wallet payment successful for booking ${bookingId}`);

    return res.status(200).json({
      success: true,
      message: 'Payment successful',
      data: {
        bookingId,
        amount,
        method: 'wallet',
        status: 'SUCCESS',
      },
    });
  }

  // Create Razorpay order for other payment methods
  const orderOptions = {
    amount: Math.round(amount * 100), // Convert to paise
    currency: 'INR',
    receipt: `booking_${bookingId}`,
    notes: {
      bookingId,
      userId,
      bookingNumber: booking.bookingNumber,
    },
  };

  try {
    const order = await razorpay.orders.create(orderOptions);

    // Update booking with order ID
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        razorpayOrderId: order.id,
      },
    });

    logger.info(`Razorpay order created: ${order.id} for booking ${bookingId}`);

    res.status(200).json({
      success: true,
      message: 'Payment order created',
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        bookingId,
      },
    });
  } catch (error) {
    logger.error('Failed to create Razorpay order:', error);
    throw new BadRequestError('Failed to create payment order');
  }
});

// ============================================================================
// VERIFY PAYMENT
// ============================================================================

/**
 * Verify Razorpay payment
 * POST /api/v1/payments/verify
 */
export const verifyPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature }: PaymentVerificationRequest = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new BadRequestError('Order ID, payment ID, and signature are required');
  }

  // Verify signature
  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'test_secret')
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    throw new BadRequestError('Invalid payment signature');
  }

  // Get booking by order ID
  const booking = await prisma.booking.findFirst({
    where: { razorpayOrderId },
  });

  if (!booking) {
    throw new NotFoundError('Booking not found');
  }

  // Update booking
  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: 'CONFIRMED',
      paymentStatus: 'CAPTURED',
      paidAmount: booking.totalAmount,
      razorpayPaymentId,
      razorpaySignature,
      paymentMethod: 'razorpay',
      confirmedAt: new Date(),
    },
  });

  logger.info(`Payment verified for booking ${booking.id}`);

  res.status(200).json({
    success: true,
    message: 'Payment verified successfully',
    data: {
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      amount: booking.totalAmount,
      status: 'CONFIRMED',
    },
  });
});

// ============================================================================
// WALLET OPERATIONS
// ============================================================================

/**
 * Get wallet balance
 * GET /api/v1/payments/wallet
 */
export const getWallet = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }

  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!wallet) {
    // Create wallet if not exists
    const newWallet = await prisma.wallet.create({
      data: {
        userId,
        balance: 0,
        currency: 'INR',
      },
      include: {
        transactions: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Wallet retrieved',
      data: newWallet,
    });
  }

  res.status(200).json({
    success: true,
    message: 'Wallet retrieved',
    data: wallet,
  });
});

/**
 * Add money to wallet
 * POST /api/v1/payments/wallet/add
 */
export const addMoneyToWallet = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }

  const { amount } = req.body;

  if (!amount || amount <= 0) {
    throw new BadRequestError('Valid amount is required');
  }

  // Create Razorpay order for wallet top-up
  const orderOptions = {
    amount: Math.round(amount * 100),
    currency: 'INR',
    receipt: `wallet_${userId}_${Date.now()}`,
    notes: {
      userId,
      type: 'WALLET_TOPUP',
    },
  };

  try {
    const order = await razorpay.orders.create(orderOptions);

    logger.info(`Wallet top-up order created: ${order.id} for user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Wallet top-up order created',
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    logger.error('Failed to create wallet top-up order:', error);
    throw new BadRequestError('Failed to create wallet top-up order');
  }
});

/**
 * Verify wallet top-up
 * POST /api/v1/payments/wallet/verify
 */
export const verifyWalletTopup = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  
  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, amount } = req.body;

  // Verify signature
  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'test_secret')
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    throw new BadRequestError('Invalid payment signature');
  }

  // Get or create wallet
  let wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId,
        balance: 0,
        currency: 'INR',
      },
    });
  }

  // Add money to wallet
  await prisma.wallet.update({
    where: { userId },
    data: {
      balance: {
        increment: amount,
      },
    },
  });

  // Create transaction record
  await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: 'CREDIT',
      amount,
      status: 'SUCCESS',
      description: 'Wallet top-up',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    },
  });

  logger.info(`Wallet top-up successful: ${amount} for user ${userId}`);

  res.status(200).json({
    success: true,
    message: 'Wallet top-up successful',
    data: {
      amount,
      status: 'SUCCESS',
    },
  });
});

// ============================================================================
// WEBHOOK HANDLER
// ============================================================================

/**
 * Handle Razorpay webhooks
 * POST /api/v1/payments/webhook
 */
export const handleWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['x-razorpay-signature'] as string;
  
  if (!signature) {
    throw new BadRequestError('Webhook signature missing');
  }

  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret')
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (signature !== expectedSignature) {
    throw new BadRequestError('Invalid webhook signature');
  }

  const { event, payload } = req.body;

  logger.info(`Razorpay webhook received: ${event}`);

  // Handle different events
  switch (event) {
    case 'payment.captured':
      // Payment captured - booking already updated in verify endpoint
      break;
    case 'payment.failed':
      // Handle payment failure
      const orderId = payload.payment.entity.order_id;
      await prisma.booking.updateMany({
        where: { razorpayOrderId: orderId },
        data: { paymentStatus: 'FAILED' },
      });
      break;
    case 'refund.processed':
      // Handle refund
      // TODO: Update cancellation request status
      break;
  }

  res.status(200).json({ received: true });
});