import { Router } from 'express';
import {
  createRentInvoice,
  getTenantLedger,
  getOwnerLedger,
  payRentInvoice,
  markInvoicePaid,
  serveMoveOutNotice,
  getLedgerInvoiceById,
} from '../controllers/ledger.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// All ledger routes require authentication
router.use(protect);

// Landlord Invoicing
router.post('/invoice', authorize(ROLES.OWNER, ROLES.ADMIN), createRentInvoice);
router.get('/owner-ledger', authorize(ROLES.OWNER, ROLES.ADMIN), getOwnerLedger);
router.patch('/:id/mark-paid', authorize(ROLES.OWNER, ROLES.ADMIN), markInvoicePaid);

// Tenant Statements & Payment
router.get('/my-ledger', authorize(ROLES.USER, ROLES.ADMIN), getTenantLedger);
router.post('/:id/pay', authorize(ROLES.USER, ROLES.ADMIN), payRentInvoice);
router.post('/notice', authorize(ROLES.USER, ROLES.ADMIN), serveMoveOutNotice);

// Single Invoice / Receipt Details
router.get('/invoice/:id', getLedgerInvoiceById);

export default router;
