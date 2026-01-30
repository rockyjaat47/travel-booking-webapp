/**
 * TYPE DEFINITIONS
 * Shared types and interfaces for the application
 */

import { Request } from 'express';
import { UserRole, BookingCategory, BookingStatus, PaymentStatus } from '@prisma/client';

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface LoginRequest {
  email?: string;
  phone?: string;
  password?: string;
  otp?: string;
  loginMethod: 'password' | 'otp';
}

export interface RegisterRequest {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface OtpRequest {
  phone: string;
  purpose: 'LOGIN' | 'SIGNUP' | 'PASSWORD_RESET';
}

export interface OtpVerifyRequest {
  phone: string;
  otp: string;
  purpose: 'LOGIN' | 'SIGNUP' | 'PASSWORD_RESET';
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: string;
  profileImage?: string;
}

export interface UpdateKycRequest {
  documentType: string;
  documentNumber: string;
  documentImage: string;
}

// ============================================================================
// BOOKING TYPES
// ============================================================================

export interface PassengerInfo {
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  gender?: string;
  phone?: string;
  email?: string;
  seatNumber?: string;
  seatPreference?: string;
  mealPreference?: string;
  specialAssistance?: string;
  idType?: string;
  idNumber?: string;
  guestType?: 'ADULT' | 'CHILD';
}

export interface AddOnItem {
  name: string;
  price: number;
  quantity: number;
}

export interface CreateBookingRequest {
  category: BookingCategory;
  
  // Bus specific
  busScheduleId?: string;
  
  // Flight specific
  flightScheduleId?: string;
  cabinClass?: string;
  
  // Hotel specific
  roomInventoryId?: string;
  checkInDate?: Date;
  checkOutDate?: Date;
  nights?: number;
  
  // Common
  passengers: PassengerInfo[];
  primaryPassengerName: string;
  primaryPassengerPhone?: string;
  primaryPassengerEmail?: string;
  addOns?: AddOnItem[];
  couponCode?: string;
}

export interface BookingResponse {
  id: string;
  bookingNumber: string;
  category: BookingCategory;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  baseAmount: number;
  taxAmount: number;
  convenienceFee: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  createdAt: Date;
}

// ============================================================================
// SEARCH TYPES
// ============================================================================

export interface BusSearchRequest {
  source: string;
  destination: string;
  travelDate: Date;
  passengers?: number;
}

export interface FlightSearchRequest {
  source: string;
  destination: string;
  departureDate: Date;
  returnDate?: Date;
  passengers: number;
  cabinClass?: string;
  tripType: 'one-way' | 'round-trip';
}

export interface HotelSearchRequest {
  city: string;
  checkInDate: Date;
  checkOutDate: Date;
  guests: number;
  rooms?: number;
  starRating?: number[];
  minPrice?: number;
  maxPrice?: number;
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export interface CreatePaymentRequest {
  bookingId: string;
  amount: number;
  method: 'razorpay' | 'wallet' | 'upi' | 'card';
}

export interface PaymentVerificationRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

// ============================================================================
// HOLD QUOTA TYPES
// ============================================================================

export interface HoldSeatsRequest {
  scheduleId: string;
  seatNumbers: string[];
  heldBy: string;
}

export interface HoldSeatsResponse {
  holdId: string;
  seatNumbers: string[];
  holdExpiry: Date;
  status: string;
}

export interface ReleaseHoldRequest {
  holdId: string;
}

// ============================================================================
// CANCELLATION TYPES
// ============================================================================

export interface CancellationRequest {
  bookingId: string;
  reason: string;
  subReason?: string;
  description?: string;
}

export interface CancellationResponse {
  eligibleRefundAmount: number;
  cancellationCharges: number;
  finalRefundAmount: number;
  refundProcessingDays: number;
}

// ============================================================================
// ADMIN TYPES
// ============================================================================

export interface CreatePartnerRequest {
  name: string;
  type: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  gstNumber?: string;
  panNumber?: string;
  holdQuotaEnabled?: boolean;
  holdQuotaPercentage?: number;
  holdExpiryMinutes?: number;
}

export interface UpdateInventoryRequest {
  partnerId: string;
  category: BookingCategory;
  totalQuantity: number;
  baseCost: number;
  sellingPrice: number;
  validFrom: Date;
  validUntil: Date;
}

export interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  totalUsers: number;
  totalPartners: number;
  pendingCancellations: number;
  activeHolds: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: string;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}