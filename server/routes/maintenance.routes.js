import { Router } from 'express';
import {
  createTicket,
  getMyTickets,
  getOwnerTickets,
  getTicketById,
  acknowledgeTicket,
  startTicket,
  resolveTicket,
  closeTicket,
  reopenTicket,
  getSLASummary,
  getAdminOverview,
} from '../controllers/maintenance.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Tenant & General Routes
router.post('/', protect, authorize(ROLES.USER), createTicket);
router.get('/my-tickets', protect, authorize(ROLES.USER, ROLES.ADMIN), getMyTickets);

// Landlord / Owner Routes
router.get('/owner-tickets', protect, authorize(ROLES.OWNER, ROLES.ADMIN), getOwnerTickets);
router.get('/sla-summary', protect, authorize(ROLES.OWNER, ROLES.ADMIN), getSLASummary);

// Admin Routes
router.get('/admin-overview', protect, authorize(ROLES.ADMIN), getAdminOverview);

// Single Ticket Lifecycle Actions
router.get('/:id', protect, authorize(ROLES.USER, ROLES.OWNER, ROLES.ADMIN), getTicketById);
router.patch('/:id/acknowledge', protect, authorize(ROLES.OWNER, ROLES.ADMIN), acknowledgeTicket);
router.patch('/:id/start', protect, authorize(ROLES.OWNER, ROLES.ADMIN), startTicket);
router.patch('/:id/resolve', protect, authorize(ROLES.OWNER, ROLES.ADMIN), resolveTicket);
router.patch('/:id/close', protect, authorize(ROLES.USER, ROLES.OWNER, ROLES.ADMIN), closeTicket);
router.patch('/:id/reopen', protect, authorize(ROLES.USER, ROLES.ADMIN), reopenTicket);

export default router;
