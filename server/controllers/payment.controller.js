import { paymentService } from '../services/paymentService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { ROLES } from '../constants/roles.js';
import { Transaction } from '../models/Transaction.js';

/**
 * @desc    Create a payment gateway order
 * @route   POST /api/v1/payments/create-order
 * @access  Private (Tenant, Owner, Admin)
 */
export const createOrder = async (req, res, next) => {
  try {
    const { amount, purpose, referenceId, referenceType, idempotencyKey, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      return errorResponse(res, 'Valid payment amount is required', 400);
    }

    const orderData = await paymentService.createPaymentOrder({
      userId: req.user._id,
      amount: Number(amount),
      purpose: purpose || 'RENT',
      referenceId,
      referenceType: referenceType || 'RENT_LEDGER',
      idempotencyKey,
      paymentMethod,
    });

    return successResponse(res, 'Payment order created successfully', orderData, 201);
  } catch (error) {
    if (error.statusCode === 400) {
      return errorResponse(res, error.message, 400);
    }
    next(error);
  }
};

/**
 * @desc    Verify payment signature and settle ledger
 * @route   POST /api/v1/payments/verify
 * @access  Private (Tenant, Owner, Admin)
 */
export const verifyPayment = async (req, res, next) => {
  try {
    const { orderId, paymentId, signature, paymentMethod, idempotencyKey } = req.body;

    if (!orderId && !idempotencyKey) {
      return errorResponse(res, 'orderId or idempotencyKey is required for verification', 400);
    }

    const result = await paymentService.verifyPaymentSignature({
      orderId,
      paymentId,
      signature,
      paymentMethod,
      idempotencyKey,
    });

    return successResponse(res, result.message, result, 200);
  } catch (error) {
    if (error.statusCode === 404) {
      return errorResponse(res, error.message, 404);
    }
    if (error.statusCode === 400) {
      return errorResponse(res, error.message, 400);
    }
    next(error);
  }
};

/**
 * @desc    Simulated payment webhook listener
 * @route   POST /api/v1/payments/webhook
 * @access  Public (Validated with signature)
 */
export const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'] || req.headers['x-webhook-signature'];
    const result = await paymentService.processWebhookEvent({
      event: req.body.event,
      payload: req.body.payload || req.body,
      signature,
    });

    return successResponse(res, result.message, result, 200);
  } catch (error) {
    if (error.statusCode === 400) {
      return errorResponse(res, error.message, 400);
    }
    next(error);
  }
};

/**
 * @desc    Process refund for escrow deposit or rent invoice
 * @route   POST /api/v1/payments/refund
 * @access  Private (Owner, Admin)
 */
export const processRefund = async (req, res, next) => {
  try {
    const { bookingId, invoiceId, refundAmount, reason } = req.body;

    if (!refundAmount || refundAmount <= 0) {
      return errorResponse(res, 'Valid refund amount is required', 400);
    }

    const result = await paymentService.processRefund({
      bookingId,
      invoiceId,
      refundAmount: Number(refundAmount),
      reason,
      requestedBy: req.user._id,
    });

    return successResponse(res, result.message, result, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user or platform transaction audit history
 * @route   GET /api/v1/payments/transactions
 * @access  Private (Tenant, Owner, Admin)
 */
export const getTransactions = async (req, res, next) => {
  try {
    const { type, status, limit = 50 } = req.query;

    const query = {};

    if (req.user.role === ROLES.USER) {
      query.tenantId = req.user._id;
    } else if (req.user.role === ROLES.OWNER) {
      query.ownerId = req.user._id;
    }
    // Admin sees all transactions

    if (type) query.type = type;
    if (status) query.status = status;

    const transactions = await Transaction.find(query)
      .populate('userId', 'name email')
      .populate('tenantId', 'name email')
      .populate('ownerId', 'name email')
      .populate('propertyId', 'title address')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    return successResponse(res, 'Transaction history retrieved', { transactions, count: transactions.length }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get digital receipt details
 * @route   GET /api/v1/payments/receipt/:receiptNumber
 * @access  Private (Tenant, Owner, Admin)
 */
export const getReceipt = async (req, res, next) => {
  try {
    const { receiptNumber } = req.params;
    const receiptData = await paymentService.getReceiptDetails(receiptNumber);

    return successResponse(res, 'Digital receipt retrieved', { receipt: receiptData }, 200);
  } catch (error) {
    if (error.statusCode === 404) {
      return errorResponse(res, error.message, 404);
    }
    next(error);
  }
};

/**
 * @desc    Get Tenant Financial Summary & Wallet Ledger
 * @route   GET /api/v1/payments/finance/tenant
 * @access  Private (Tenant)
 */
export const getTenantFinance = async (req, res, next) => {
  try {
    if (req.user.role !== ROLES.USER && req.user.role !== ROLES.ADMIN) {
      return errorResponse(res, 'Only tenants can access tenant financial dashboard', 403);
    }

    const summary = await paymentService.getTenantFinancialSummary(req.user._id);
    return successResponse(res, 'Tenant financial summary retrieved', { summary }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Owner Earnings, Payout Balance & Escrow Holdings
 * @route   GET /api/v1/payments/finance/owner
 * @access  Private (Owner)
 */
export const getOwnerFinance = async (req, res, next) => {
  try {
    if (req.user.role !== ROLES.OWNER && req.user.role !== ROLES.ADMIN) {
      return errorResponse(res, 'Only property owners can access owner financial dashboard', 403);
    }

    const summary = await paymentService.getOwnerFinancialSummary(req.user._id);
    return successResponse(res, 'Owner financial summary retrieved', { summary }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Admin Platform Financial Control Panel
 * @route   GET /api/v1/payments/finance/admin
 * @access  Private (Admin)
 */
export const getAdminFinance = async (req, res, next) => {
  try {
    if (req.user.role !== ROLES.ADMIN) {
      return errorResponse(res, 'Access denied: Admin permissions required', 403);
    }

    const summary = await paymentService.getAdminFinancialSummary();
    return successResponse(res, 'Admin platform financial summary retrieved', { summary }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Request/process landlord payout
 * @route   POST /api/v1/payments/owner/payout
 * @access  Private (Owner, Admin)
 */
export const processPayout = async (req, res, next) => {
  try {
    const { amount, bankAccount } = req.body;
    const ownerId = req.user.role === ROLES.ADMIN && req.body.ownerId ? req.body.ownerId : req.user._id;

    if (!amount || amount <= 0) {
      return errorResponse(res, 'Valid payout amount is required', 400);
    }

    const result = await paymentService.processOwnerPayout({
      ownerId,
      amount: Number(amount),
      bankAccount: bankAccount || 'ICICI-XXXX-9876',
    });

    return successResponse(res, result.message, result, 200);
  } catch (error) {
    next(error);
  }
};
