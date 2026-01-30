# Lean Travel & Booking Platform

A production-ready travel booking platform for buses, flights, and hotels with advanced inventory management, hold quota system, and comprehensive admin panel.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Key Business Logic](#key-business-logic)
- [Admin Panel](#admin-panel)
- [Phase-2 TODOs](#phase-2-todos)

## Features

### Core Modules (Phase-1)

1. **User Authentication**
   - Email/Password login
   - OTP-based login
   - JWT token management
   - User profile management
   - KYC verification

2. **Booking Categories**
   - Bus Booking with seat selection
   - Airline Booking with cabin class selection
   - Hotel Booking with room selection

3. **Inventory & Hold Logic**
   - Pre-purchased inventory support
   - 25% ticket hold quota per schedule
   - Auto-release holds after expiry (cron job)
   - Admin-controlled enable/disable per partner

4. **Booking Flow**
   - Search with filters
   - Availability check
   - Fare rules display
   - Add-ons (seat, meal, baggage)
   - Payment integration (Razorpay)
   - Booking confirmation

5. **Policies Engine**
   - Cancellation & refund rules
   - 24-hour free cancellation
   - No-show rules
   - Airline-initiated cancellation handling

6. **Admin Panel**
   - Dashboard with analytics
   - Inventory management
   - Hold quota configuration
   - Booking management
   - Cancellation & refund approvals
   - User management
   - Reports & dashboards

## Tech Stack

### Backend
- **Framework**: Node.js + Express
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT + Role-based access
- **Payments**: Razorpay (mock integration for MVP)
- **Cron Jobs**: node-cron

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: React Query
- **UI Components**: Custom + Radix UI

## Project Structure

```
lean-travel-platform/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── src/
│   │   ├── config/             # Configuration files
│   │   ├── controllers/        # Route controllers
│   │   ├── middleware/         # Express middleware
│   │   ├── routes/             # API routes
│   │   ├── services/           # Business logic
│   │   ├── utils/              # Utility functions
│   │   ├── types/              # TypeScript types
│   │   └── server.ts           # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/
│   ├── app/                    # Next.js app router
│   │   ├── page.tsx            # Home page
│   │   ├── login/
│   │   ├── register/
│   │   ├── search/
│   │   ├── bookings/
│   │   └── admin/
│   ├── components/
│   │   ├── ui/                 # UI components
│   │   ├── layout/             # Layout components
│   │   └── providers/          # Context providers
│   ├── stores/                 # Zustand stores
│   ├── lib/                    # Utility functions
│   ├── types/                  # TypeScript types
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.ts
│
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials and API keys

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) Seed the database
npm run db:seed

# Start development server
npm run dev
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API URL

# Start development server
npm run dev
```

## Environment Variables

### Backend (.env)

```env
# Server
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/lean_travel_db?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Razorpay
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Twilio (for OTP)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_phone_number

# Hold Quota
DEFAULT_HOLD_QUOTA_PERCENTAGE=25
DEFAULT_HOLD_EXPIRY_MINUTES=30
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id
NEXT_PUBLIC_APP_NAME=Lean Travel
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Database Schema

### Core Entities

- **User**: Customer accounts with authentication
- **Partner**: Bus operators, airlines, hotel chains
- **BusRoute/Flight/Hotel**: Service offerings
- **Schedule**: Daily availability
- **Booking**: Customer reservations
- **SeatHold**: Temporary seat holds
- **InventoryBatch**: Pre-purchased inventory

### Key Relationships

```
User 1:N Booking
User 1:1 Wallet
Partner 1:N BusRoute/Flight/Hotel
BusRoute 1:N BusSchedule
BusSchedule 1:N SeatHold
Booking 1:N BookingPassenger
```

## API Documentation

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login (password or OTP)
- `POST /api/v1/auth/otp/send` - Send OTP
- `POST /api/v1/auth/otp/verify` - Verify OTP
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout

### Search
- `GET /api/v1/buses/search` - Search buses
- `GET /api/v1/flights/search` - Search flights
- `GET /api/v1/hotels/search` - Search hotels

### Bookings
- `POST /api/v1/bookings` - Create booking
- `GET /api/v1/bookings` - Get user bookings
- `GET /api/v1/bookings/:id` - Get booking details
- `PATCH /api/v1/bookings/:id/confirm` - Confirm booking
- `POST /api/v1/bookings/:id/cancel` - Cancel booking

### Payments
- `POST /api/v1/payments/create-order` - Create payment order
- `POST /api/v1/payments/verify` - Verify payment
- `GET /api/v1/payments/wallet` - Get wallet balance

### Admin
- `GET /api/v1/admin/dashboard` - Dashboard stats
- `GET /api/v1/admin/users` - List users
- `GET /api/v1/admin/partners` - List partners
- `POST /api/v1/admin/partners` - Create partner
- `GET /api/v1/admin/bookings` - List all bookings
- `GET /api/v1/admin/cancellations` - List cancellation requests

## Key Business Logic

### Hold Quota System

The platform implements a 25% hold quota system for inventory management:

1. **Hold Creation**: When a user selects seats, they are held for 10 minutes
2. **Quota Limit**: Maximum 25% of total seats can be on hold at any time
3. **Auto-Release**: Expired holds are automatically released via cron job (runs every 5 minutes)
4. **Partner Control**: Admins can enable/disable holds per partner

```typescript
// Calculate max holds
const maxHolds = Math.floor((totalSeats * holdQuotaPercentage) / 100);

// Check availability
const quotaCheck = await isHoldQuotaAvailable(scheduleId, requestedSeats, 'BUS');
```

### Cancellation & Refunds

1. **Free Cancellation**: Within 24 hours of booking
2. **Cancellation Charges**: Applied after free window based on fare rules
3. **Refund Processing**: 7 days for standard refunds
4. **Approval Workflow**: Admin approval for certain cancellations

### Pricing

- Base fare from partner
- Convenience fee: 2% of base amount
- GST on convenience: 5%
- Add-ons (configurable per category)

## Admin Panel

### Dashboard
- Total bookings, revenue, users
- Pending cancellations
- Active holds
- Recent bookings

### User Management
- View all users
- Update user status
- Create admin users

### Partner Management
- Add/edit partners
- Configure hold quota settings
- View partner inventory

### Booking Management
- View all bookings
- Update booking status
- Process cancellations

### Reports
- Sales report
- Booking report
- Revenue report
- User report
- Cancellation report

## Phase-2 TODOs

### Features to Add

1. **Train Booking**
   - IRCTC integration
   - PNR status check
   - Seat availability

2. **Events & Activities**
   - Event listings
   - Ticket booking
   - Venue management

3. **Enhanced Search**
   - Multi-city flights
   - Flexible dates
   - Price alerts

4. **Loyalty Program**
   - Points system
   - Tier benefits
   - Referral program

5. **Mobile App**
   - React Native app
   - Push notifications
   - Offline support

6. **Internationalization**
   - Multi-language support
   - Currency conversion
   - Regional payment methods

7. **Advanced Analytics**
   - User behavior tracking
   - Revenue analytics
   - Predictive pricing

8. **API Integration**
   - Third-party APIs
   - Webhook system
   - Developer portal

### Technical Improvements

1. **Caching**
   - Redis for session storage
   - API response caching
   - CDN for static assets

2. **Performance**
   - Database query optimization
   - Connection pooling
   - Load balancing

3. **Security**
   - Rate limiting per user
   - IP blocking
   - Advanced fraud detection

4. **Monitoring**
   - Application metrics
   - Error tracking
   - Performance monitoring

## License

MIT License - See LICENSE file for details

## Support

For support, email support@leantravel.com or join our Slack channel.

---

Built with ❤️ by the Lean Travel Team