/**
 * OTP UTILITY FUNCTIONS
 * Handles OTP generation and SMS sending
 */

import twilio from 'twilio';
import { logger } from './logger';

// Twilio configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client (only in production)
let twilioClient: twilio.Twilio | null = null;

if (process.env.NODE_ENV === 'production' && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

/**
 * Generate a 6-digit OTP
 */
export const generateOtp = (): string => {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
};

/**
 * Send OTP via SMS using Twilio
 */
export const sendOtpSms = async (phone: string, otp: string): Promise<boolean> => {
  try {
    // In development, just log the OTP
    if (process.env.NODE_ENV !== 'production') {
      logger.info(`[DEV] OTP for ${phone}: ${otp}`);
      return true;
    }

    // Check if Twilio is configured
    if (!twilioClient || !TWILIO_PHONE_NUMBER) {
      logger.warn('Twilio not configured, OTP not sent');
      return false;
    }

    // Format phone number (ensure +91 for India)
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

    // Send SMS
    const message = await twilioClient.messages.create({
      body: `Your Lean Travel verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`,
      from: TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    logger.info(`OTP SMS sent to ${phone}, SID: ${message.sid}`);
    return true;
  } catch (error) {
    logger.error('Failed to send OTP SMS:', error);
    return false;
  }
};

/**
 * Mask phone number for display
 */
export const maskPhoneNumber = (phone: string): string => {
  if (phone.length < 4) return phone;
  const last4 = phone.slice(-4);
  const masked = '*'.repeat(phone.length - 4);
  return masked + last4;
};

/**
 * Validate phone number format (Indian numbers)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  // Indian phone number regex: 10 digits, optionally with +91 prefix
  const indianPhoneRegex = /^(\+91)?[6-9]\d{9}$/;
  return indianPhoneRegex.test(phone);
};