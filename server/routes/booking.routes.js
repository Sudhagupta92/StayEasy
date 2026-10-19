import { Router } from 'express';
import {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getOwnerBookings,
  updateBookingStatus,
  getOwnerResidents,
  payEscrowDeposit,
  settleEscrowDeposit,
  getEscrowReceipt,
} from '../controllers/booking.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// All booking routes require authentication
router.use(protect);

// Tenant Booking Routes
router.post('/', authorize(ROLES.USER, ROLES.ADMIN), createBooking);
router.get('/my-bookings', authorize(ROLES.USER, ROLES.ADMIN), getMyBookings);

// Owner Booking & Resident Routes
router.get('/owner-bookings', authorize(ROLES.OWNER, ROLES.ADMIN), getOwnerBookings);
router.get('/owner-residents', authorize(ROLES.OWNER, ROLES.ADMIN), getOwnerResidents);

// Escrow Operations
router.post('/:id/escrow/pay', authorize(ROLES.USER, ROLES.ADMIN), payEscrowDeposit);
router.post('/:id/escrow/settle', authorize(ROLES.OWNER, ROLES.ADMIN), settleEscrowDeposit);
router.get('/:id/escrow/receipt', getEscrowReceipt);

// Single Booking actions
router.get('/:id', getBookingById);
router.post('/:id/cancel', cancelBooking);
router.patch('/:id/status', authorize(ROLES.OWNER, ROLES.ADMIN), updateBookingStatus);

export default router;
