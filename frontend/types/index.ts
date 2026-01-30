/**
 * FRONTEND TYPE DEFINITIONS
 * Shared types for the Lean Travel Platform frontend
 */

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  profileImage?: string;
  role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN' | 'PARTNER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isKycVerified: boolean;
  wallet?: {
    balance: number;
    currency: string;
  };
}

export interface LoginCredentials {
  email?: string;
  phone?: string;
  password?: string;
  otp?: string;
  loginMethod: 'password' | 'otp';
}

export interface RegisterData {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
}

// ============================================================================
// BOOKING TYPES
// ============================================================================

export type BookingCategory = 'BUS' | 'AIRLINE' | 'HOTEL';
export type BookingStatus = 
  | 'PENDING' 
  | 'ON_HOLD' 
  | 'CONFIRMED' 
  | 'CANCELLED' 
  | 'NO_SHOW' 
  | 'COMPLETED' 
  | 'FAILED' 
  | 'REFUNDED' 
  | 'PARTIALLY_REFUNDED';

export interface Passenger {
  id?: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
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

export interface AddOn {
  name: string;
  price: number;
  quantity: number;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  category: BookingCategory;
  status: BookingStatus;
  paymentStatus: 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  baseAmount: number;
  taxAmount: number;
  convenienceFee: number;
  discountAmount: number;
  addOnAmount: number;
  totalAmount: number;
  paidAmount: number;
  primaryPassengerName: string;
  primaryPassengerPhone?: string;
  primaryPassengerEmail?: string;
  passengers: Passenger[];
  addOns?: AddOn[];
  createdAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  refundAmount?: number;
  
  // Bus specific
  busSchedule?: BusSchedule;
  
  // Flight specific
  flightSchedule?: FlightSchedule;
  cabinClass?: string;
  
  // Hotel specific
  roomInventory?: RoomInventory;
  checkInDate?: string;
  checkOutDate?: string;
  nights?: number;
}

// ============================================================================
// BUS TYPES
// ============================================================================

export type BusType = 
  | 'SLEEPER_AC' 
  | 'SLEEPER_NON_AC' 
  | 'SEATER_AC' 
  | 'SEATER_NON_AC' 
  | 'SEMI_SLEEPER_AC' 
  | 'SEMI_SLEEPER_NON_AC' 
  | 'VOLVO_AC' 
  | 'VOLVO_MULTI_AXLE' 
  | 'LUXURY';

export interface BusRoute {
  id: string;
  routeNumber: string;
  source: string;
  destination: string;
  sourceStation: string;
  destinationStation: string;
  distanceKm?: number;
  durationMinutes: number;
  busType: BusType;
  amenities: string[];
  departureTime: string;
  arrivalTime: string;
  baseFare: number;
  totalSeats: number;
  seatLayout: any;
}

export interface BusSchedule {
  id: string;
  routeId: string;
  scheduleDate: string;
  baseFare: number;
  availableSeats: number;
  bookedSeats: number;
  heldSeats: number;
  seatStatus: Record<string, 'AVAILABLE' | 'BOOKED' | 'HELD'>;
  status: string;
  route: BusRoute;
}

export interface BusSearchResult {
  scheduleId: string;
  routeId: string;
  operator: string;
  routeNumber: string;
  source: string;
  destination: string;
  sourceStation: string;
  destinationStation: string;
  busType: BusType;
  amenities: string[];
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  distanceKm?: number;
  fare: number;
  availableSeats: number;
  totalSeats: number;
  seatLayout: any;
  seatStatus: Record<string, string>;
  holdQuotaEnabled: boolean;
}

// ============================================================================
// FLIGHT TYPES
// ============================================================================

export type CabinClass = 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';

export interface Flight {
  id: string;
  flightNumber: string;
  airlineCode: string;
  airlineName: string;
  source: string;
  destination: string;
  sourceAirport: string;
  destinationAirport: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  aircraftType?: string;
}

export interface FareRules {
  id: string;
  cancellationFreeWithinHours: number;
  cancellationChargePercentage: number;
  cancellationChargeFixed?: number;
  noShowChargePercentage: number;
  rescheduleAllowed: boolean;
  rescheduleCharge: number;
  cabinBaggageKg: number;
  checkInBaggageKg: number;
  refundProcessingDays: number;
}

export interface FlightSchedule {
  id: string;
  flightId: string;
  scheduleDate: string;
  fares: {
    economy: number;
    premium?: number;
    business?: number;
    first?: number;
  };
  availability: {
    economy: number;
    premium: number;
    business: number;
    first: number;
  };
  flight: Flight;
  fareRules?: FareRules;
}

export interface FlightSearchResult {
  scheduleId: string;
  flightId: string;
  flightNumber: string;
  airlineCode: string;
  airlineName: string;
  source: string;
  destination: string;
  sourceAirport: string;
  destinationAirport: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  aircraftType?: string;
  fares: {
    economy: number;
    premium?: number;
    business?: number;
    first?: number;
  };
  availability: {
    economy: number;
    premium: number;
    business: number;
    first: number;
  };
  fareRules?: FareRules;
}

// ============================================================================
// HOTEL TYPES
// ============================================================================

export type HotelType = 'BUDGET' | 'STANDARD' | 'DELUXE' | 'LUXURY' | 'RESORT' | 'BOUTIQUE';
export type RoomType = 'SINGLE' | 'DOUBLE' | 'TWIN' | 'DELUXE' | 'SUITE' | 'FAMILY' | 'PRESIDENTIAL';

export interface Hotel {
  id: string;
  name: string;
  type: HotelType;
  starRating?: number;
  address: string;
  city: string;
  state: string;
  country: string;
  amenities: string[];
  images: string[];
  checkInTime: string;
  checkOutTime: string;
}

export interface Room {
  id: string;
  hotelId: string;
  roomType: RoomType;
  roomCategory: string;
  roomSize?: string;
  maxAdults: number;
  maxChildren: number;
  bedType: string;
  amenities: string[];
  images: string[];
  totalRooms: number;
  basePrice: number;
}

export interface RoomInventory {
  id: string;
  roomId: string;
  date: string;
  price: number;
  availableRooms: number;
  isAvailable: boolean;
  room: Room & { hotel: Hotel };
}

export interface HotelSearchResult {
  hotelId: string;
  name: string;
  type: HotelType;
  starRating?: number;
  address: string;
  city: string;
  state: string;
  amenities: string[];
  images: string[];
  checkInTime: string;
  checkOutTime: string;
  rooms: HotelRoomResult[];
}

export interface HotelRoomResult {
  roomId: string;
  roomType: RoomType;
  roomCategory: string;
  roomSize?: string;
  maxAdults: number;
  maxChildren: number;
  bedType: string;
  amenities: string[];
  images: string[];
  totalRooms: number;
  pricePerNight: number;
  totalPrice: number;
  nights: number;
  inventory: {
    inventoryId: string;
    date: string;
    price: number;
  }[];
}

// ============================================================================
// SEARCH PARAMS
// ============================================================================

export interface BusSearchParams {
  source: string;
  destination: string;
  travelDate: string;
  passengers?: number;
}

export interface FlightSearchParams {
  source: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  cabinClass?: CabinClass;
  tripType: 'one-way' | 'round-trip';
}

export interface HotelSearchParams {
  city: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  rooms?: number;
  starRating?: number[];
  minPrice?: number;
  maxPrice?: number;
}

// ============================================================================
// API RESPONSE
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: string;
    validationErrors?: Array<{ field: string; message: string }>;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

export interface DashboardStats {
  counts: {
    totalUsers: number;
    totalPartners: number;
    totalBookings: number;
    todayBookings: number;
    monthlyBookings: number;
  };
  revenue: {
    total: number;
    monthly: number;
  };
  pendingActions: {
    cancellations: number;
    activeHolds: number;
  };
  bookingsByCategory: Array<{
    category: BookingCategory;
    _count: { id: number };
  }>;
  recentBookings: Booking[];
}