/**
 * HOTEL ROUTES
 * Routes for hotel operations
 */

import { Router } from 'express';
import {
  searchHotels,
  getHotelDetails,
  getRoomDetails,
  createHotel,
  createRoom,
  createRoomInventory,
} from '../controllers/hotel.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

/**
 * @route   GET /api/v1/hotels/search
 * @desc    Search available hotels
 * @access  Public
 */
router.get('/search', searchHotels);

/**
 * @route   GET /api/v1/hotels/:id
 * @desc    Get hotel details
 * @access  Public
 */
router.get('/:id', getHotelDetails);

/**
 * @route   GET /api/v1/hotels/rooms/:id
 * @desc    Get room details
 * @access  Public
 */
router.get('/rooms/:id', getRoomDetails);

// ============================================================================
// ADMIN ROUTES
// ============================================================================

/**
 * @route   POST /api/v1/hotels
 * @desc    Create hotel
 * @access  Admin
 */
router.post('/', authenticate, authorizeAdmin, createHotel);

/**
 * @route   POST /api/v1/hotels/rooms
 * @desc    Create room
 * @access  Admin
 */
router.post('/rooms', authenticate, authorizeAdmin, createRoom);

/**
 * @route   POST /api/v1/hotels/rooms/inventory
 * @desc    Create room inventory
 * @access  Admin
 */
router.post('/rooms/inventory', authenticate, authorizeAdmin, createRoomInventory);

export default router;