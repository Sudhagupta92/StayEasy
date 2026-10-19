import express from 'express';
import {
  createOrder,
  verifyPayment,
  handleWebhook,
  processRefund,
  getTransactions,
  getReceipt,
  getTenantFinance,
  getOwnerFinance,
  getAdminFinance,
  processPayout,
} from '../controllers/payment.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

// Public webhook route (validated via signature header)
router.post('/webhook', handleWebhook);

// Protected routes
router.use(protect);

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.get('/transactions', getTransactions);
router.get('/receipt/:receiptNumber', getReceipt);

// Role-based finance routes
router.get('/finance/tenant', authorize(ROLES.USER, ROLES.ADMIN), getTenantFinance);
router.get('/finance/owner', authorize(ROLES.OWNER, ROLES.ADMIN), getOwnerFinance);
router.get('/finance/admin', authorize(ROLES.ADMIN), getAdminFinance);

router.post('/refund', authorize(ROLES.OWNER, ROLES.ADMIN), processRefund);
router.post('/owner/payout', authorize(ROLES.OWNER, ROLES.ADMIN), processPayout);

export default router;
