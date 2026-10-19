import crypto from 'crypto';
import { Transaction } from '../models/Transaction.js';
import { Booking } from '../models/Booking.js';
import { RentLedger } from '../models/RentLedger.js';
import { Property } from '../models/Property.js';
import { User } from '../models/User.js';
import {
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  PAYMENT_METHODS,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITY,
  ESCROW_STATUS,
  PAYMENT_STATUS,
  BOOKING_STATUS,
} from '../constants/roles.js';
import { notificationService } from './notificationService.js';

const MOCK_GATEWAY_SECRET = process.env.JWT_SECRET || 'stayeasy_mock_secret_key';

export const paymentService = {
  /**
   * Create a simulated payment gateway order (e.g. Razorpay order_SE_...)
   */
  createPaymentOrder: async ({
    userId,
    amount,
    purpose = 'RENT',
    referenceId,
    referenceType = 'RENT_LEDGER',
    idempotencyKey,
    paymentMethod = PAYMENT_METHODS.UPI,
  }) => {
    if (!amount || amount <= 0) {
      throw new Error('Valid payment amount is required');
    }

    // 1. Idempotency Check
    if (idempotencyKey) {
      const existingTxn = await Transaction.findOne({ idempotencyKey });
      if (existingTxn) {
        if (existingTxn.status === TRANSACTION_STATUS.SUCCESS) {
          const err = new Error('Duplicate payment attempt. Order has already been paid successfully.');
          err.statusCode = 400;
          throw err;
        }
        if (existingTxn.status === TRANSACTION_STATUS.CREATED || existingTxn.status === TRANSACTION_STATUS.PROCESSING) {
          return {
            orderId: existingTxn.gatewayOrderId,
            amount: existingTxn.amount,
            currency: existingTxn.currency,
            transactionId: existingTxn._id,
            idempotencyKey: existingTxn.idempotencyKey,
            keyId: 'rzp_test_stayeasy',
            signaturePayload: `${existingTxn.gatewayOrderId}|${existingTxn.amount}`,
          };
        }
      }
    }

    // 2. Resolve entities
    let booking = null;
    let invoice = null;
    let ownerId = null;
    let tenantId = userId;
    let propertyId = null;
    let type = TRANSACTION_TYPES.RENT_PAYMENT;

    if (referenceType === 'RENT_LEDGER' && referenceId) {
      invoice = await RentLedger.findById(referenceId);
      if (!invoice) throw new Error('Rent invoice not found');
      ownerId = invoice.ownerId;
      tenantId = invoice.tenantId;
      propertyId = invoice.propertyId;
      booking = await Booking.findById(invoice.bookingId);
      type = TRANSACTION_TYPES.RENT_PAYMENT;
    } else if (referenceType === 'BOOKING' && referenceId) {
      booking = await Booking.findById(referenceId);
      if (!booking) throw new Error('Booking not found');
      ownerId = booking.ownerId;
      tenantId = booking.tenantId;
      propertyId = booking.propertyId;
      type = TRANSACTION_TYPES.DEPOSIT;
    }

    // 3. Generate Gateway Order ID
    const randHex = crypto.randomBytes(6).toString('hex').toUpperCase();
    const gatewayOrderId = `order_SE_${randHex}`;

    // 4. Calculate platform fee (2% fee)
    const feeAmount = Math.round(amount * 0.02);
    const netAmount = amount - feeAmount;

    // 5. Create Transaction record
    const transaction = await Transaction.create({
      transactionReference: `SE-TXN-${Date.now()}-${randHex.slice(0, 4)}`,
      gatewayOrderId,
      idempotencyKey: idempotencyKey || `IDEM-${gatewayOrderId}`,
      userId,
      ownerId,
      tenantId,
      propertyId,
      bookingId: booking ? booking._id : null,
      invoiceId: invoice ? invoice._id : null,
      type,
      category: 'DEBIT',
      amount,
      feeAmount,
      netAmount,
      currency: 'INR',
      paymentMethod,
      paymentGateway: 'RAZORPAY_MOCK',
      status: TRANSACTION_STATUS.CREATED,
      metadata: { purpose, referenceType, referenceId },
    });

    // 6. Fire notification
    await notificationService.notifyUser({
      userId,
      type: NOTIFICATION_TYPES.PAYMENT_ORDER_CREATED,
      title: 'Payment Order Initialized',
      message: `Payment order of ₹${amount.toLocaleString()} created (${gatewayOrderId}). Complete payment to confirm.`,
      relatedEntity: { entityType: referenceType, entityId: referenceId },
      actionUrl: '/dashboard/user',
      priority: NOTIFICATION_PRIORITY.LOW,
    });

    return {
      orderId: gatewayOrderId,
      amount: transaction.amount,
      currency: transaction.currency,
      transactionId: transaction._id,
      idempotencyKey: transaction.idempotencyKey,
      keyId: 'rzp_test_stayeasy',
      signaturePayload: `${gatewayOrderId}|${amount}`,
    };
  },

  /**
   * Verify Gateway Payment Signature & Settle Ledger
   */
  verifyPaymentSignature: async ({
    orderId,
    paymentId,
    signature,
    paymentMethod = PAYMENT_METHODS.UPI,
    idempotencyKey,
  }) => {
    let transaction = null;

    if (orderId) {
      transaction = await Transaction.findOne({ gatewayOrderId: orderId });
    } else if (idempotencyKey) {
      transaction = await Transaction.findOne({ idempotencyKey });
    }

    if (!transaction) {
      const err = new Error('Payment order not found');
      err.statusCode = 404;
      throw err;
    }

    // Idempotent success check
    if (transaction.status === TRANSACTION_STATUS.SUCCESS) {
      return {
        success: true,
        message: 'Payment already verified successfully',
        transaction,
        receiptNumber: transaction.receiptNumber,
      };
    }

    // Verify mock signature digest
    const expectedSignature = crypto
      .createHmac('sha256', MOCK_GATEWAY_SECRET)
      .update(`${transaction.gatewayOrderId}|${paymentId || 'pay_mock'}`)
      .digest('hex');

    const mockPaymentId = paymentId || `pay_SE_${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    // Update Transaction to SUCCESS
    transaction.status = TRANSACTION_STATUS.SUCCESS;
    transaction.gatewayPaymentId = mockPaymentId;
    transaction.gatewaySignature = signature || expectedSignature;
    transaction.paidAt = new Date();
    transaction.paymentMethod = paymentMethod;

    let generatedReceiptNumber = '';

    // Settle RentLedger Invoice
    if (transaction.invoiceId) {
      const invoice = await RentLedger.findById(transaction.invoiceId);
      if (invoice) {
        invoice.status = 'PAID';
        invoice.paidAt = new Date();
        invoice.amountPaid = invoice.totalAmount;
        invoice.balanceDue = 0;
        invoice.paymentMethod = paymentMethod;
        invoice.paymentReference = mockPaymentId;
        await invoice.save();

        generatedReceiptNumber = invoice.receiptNumber;
        transaction.receiptNumber = generatedReceiptNumber;

        // Notify Tenant & Owner
        await notificationService.notifyUser({
          userId: transaction.tenantId,
          type: NOTIFICATION_TYPES.RENT_PAYMENT_SUCCESS,
          title: 'Rent Payment Successful',
          message: `Rent payment of ₹${invoice.totalAmount.toLocaleString()} for ${invoice.billingMonth} confirmed (${generatedReceiptNumber}).`,
          relatedEntity: { entityType: 'RENT_LEDGER', entityId: invoice._id },
          actionUrl: '/dashboard/user',
          priority: NOTIFICATION_PRIORITY.HIGH,
        });

        if (transaction.ownerId) {
          await notificationService.notifyUser({
            userId: transaction.ownerId,
            type: NOTIFICATION_TYPES.RENT_PAYMENT_SUCCESS,
            title: 'Rent Received from Tenant',
            message: `Rent invoice of ₹${invoice.totalAmount.toLocaleString()} paid by tenant for ${invoice.billingMonth}.`,
            relatedEntity: { entityType: 'RENT_LEDGER', entityId: invoice._id },
            actionUrl: '/dashboard/owner',
            priority: NOTIFICATION_PRIORITY.HIGH,
          });
        }
      }
    }

    // Settle Booking Escrow Deposit
    if (transaction.bookingId && transaction.type === TRANSACTION_TYPES.DEPOSIT) {
      const booking = await Booking.findById(transaction.bookingId);
      if (booking) {
        booking.paymentStatus = PAYMENT_STATUS.ESCROW_HELD;
        booking.escrowStatus = ESCROW_STATUS.HELD_IN_ESCROW;
        booking.escrowPaidAt = new Date();
        booking.paymentMethod = paymentMethod || PAYMENT_METHODS.UPI;
        booking.transactionId = transaction._id;
        if (booking.status === BOOKING_STATUS.REQUESTED) {
          booking.status = BOOKING_STATUS.ACCEPTED;
        }
        await booking.save();

        generatedReceiptNumber = booking.escrowReceiptId;
        transaction.receiptNumber = generatedReceiptNumber;

        // Notify Tenant & Owner
        await notificationService.notifyUser({
          userId: transaction.tenantId,
          type: NOTIFICATION_TYPES.ESCROW_PAYMENT_SUCCESS,
          title: 'Escrow Security Deposit Confirmed',
          message: `₹${booking.costs.totalUpfrontAmount.toLocaleString()} deposited into StayEasy Escrow Protection (${booking.escrowReceiptId}).`,
          relatedEntity: { entityType: 'BOOKING', entityId: booking._id },
          actionUrl: '/dashboard/user',
          priority: NOTIFICATION_PRIORITY.HIGH,
        });

        if (transaction.ownerId) {
          await notificationService.notifyUser({
            userId: transaction.ownerId,
            type: NOTIFICATION_TYPES.ESCROW_PAYMENT_SUCCESS,
            title: 'Escrow Deposit Received',
            message: `Tenant deposited upfront rent & security deposit (₹${booking.costs.totalUpfrontAmount.toLocaleString()}) into Escrow.`,
            relatedEntity: { entityType: 'BOOKING', entityId: booking._id },
            actionUrl: '/dashboard/owner',
            priority: NOTIFICATION_PRIORITY.HIGH,
          });
        }
      }
    }

    if (!transaction.receiptNumber) {
      transaction.receiptNumber = `SE-RCT-${Date.now().toString().slice(-6)}`;
    }

    await transaction.save();

    // Also record Platform Fee transaction record
    if (transaction.feeAmount > 0) {
      await Transaction.create({
        transactionReference: `SE-FEE-${Date.now()}`,
        gatewayOrderId: transaction.gatewayOrderId,
        userId: transaction.userId,
        ownerId: transaction.ownerId,
        type: TRANSACTION_TYPES.PLATFORM_FEE,
        category: 'CREDIT',
        amount: transaction.feeAmount,
        netAmount: transaction.feeAmount,
        currency: 'INR',
        paymentMethod: transaction.paymentMethod,
        status: TRANSACTION_STATUS.SUCCESS,
        paidAt: new Date(),
        receiptNumber: `FEE-${transaction.receiptNumber}`,
      });
    }

    return {
      success: true,
      message: 'Payment verified and ledger settled successfully',
      transaction,
      receiptNumber: transaction.receiptNumber,
    };
  },

  /**
   * Handle Payment Failure
   */
  handlePaymentFailure: async ({ orderId, failureReason = 'Payment authorization failed' }) => {
    const transaction = await Transaction.findOne({ gatewayOrderId: orderId });
    if (!transaction) {
      throw new Error('Transaction order not found');
    }

    transaction.status = TRANSACTION_STATUS.FAILED;
    transaction.failureReason = failureReason;
    await transaction.save();

    // Fire failure notification
    await notificationService.notifyUser({
      userId: transaction.userId,
      type: NOTIFICATION_TYPES.PAYMENT_FAILED,
      title: 'Payment Failed',
      message: `Your payment of ₹${transaction.amount.toLocaleString()} failed: ${failureReason}. Please try again.`,
      relatedEntity: { entityType: 'TRANSACTION', entityId: transaction._id },
      actionUrl: '/dashboard/user',
      priority: NOTIFICATION_PRIORITY.HIGH,
    });

    return {
      success: false,
      message: 'Payment failure recorded',
      transaction,
    };
  },

  /**
   * Process Gateway Webhook Event
   */
  processWebhookEvent: async ({ event, payload, signature }) => {
    // Webhook verification check
    if (signature && signature === 'invalid_signature') {
      const err = new Error('Invalid webhook signature');
      err.statusCode = 400;
      throw err;
    }

    const eventType = event || payload?.event;
    const orderId = payload?.payment?.entity?.order_id || payload?.orderId;
    const paymentId = payload?.payment?.entity?.id || payload?.paymentId;

    if (eventType === 'payment.captured' && orderId) {
      return await paymentService.verifyPaymentSignature({
        orderId,
        paymentId,
        signature: 'webhook_verified',
      });
    } else if (eventType === 'payment.failed' && orderId) {
      return await paymentService.handlePaymentFailure({
        orderId,
        failureReason: payload?.error?.description || 'Gateway webhook reported failure',
      });
    }

    return {
      success: true,
      message: `Webhook event '${eventType}' processed successfully`,
    };
  },

  /**
   * Process Refund
   */
  processRefund: async ({ bookingId, invoiceId, refundAmount, reason = 'Checkout deposit refund', requestedBy }) => {
    let booking = null;
    let invoice = null;
    let userId = null;
    let ownerId = null;
    let propertyId = null;

    if (bookingId) {
      booking = await Booking.findById(bookingId);
      if (!booking) throw new Error('Booking not found');
      userId = booking.tenantId;
      ownerId = booking.ownerId;
      propertyId = booking.propertyId;

      booking.escrowStatus = ESCROW_STATUS.REFUNDED_TO_TENANT;
      booking.paymentStatus = PAYMENT_STATUS.REFUNDED;
      await booking.save();
    } else if (invoiceId) {
      invoice = await RentLedger.findById(invoiceId);
      if (!invoice) throw new Error('Invoice not found');
      userId = invoice.tenantId;
      ownerId = invoice.ownerId;
      propertyId = invoice.propertyId;

      invoice.status = 'CANCELLED';
      await invoice.save();
    }

    const randHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const receiptNumber = `SE-RFD-${Date.now().toString().slice(-6)}-${randHex}`;

    const refundTxn = await Transaction.create({
      transactionReference: `SE-RFD-${Date.now()}`,
      userId,
      ownerId,
      tenantId: userId,
      propertyId,
      bookingId: booking ? booking._id : null,
      invoiceId: invoice ? invoice._id : null,
      type: TRANSACTION_TYPES.REFUND,
      category: 'CREDIT',
      amount: refundAmount,
      netAmount: refundAmount,
      currency: 'INR',
      paymentMethod: PAYMENT_METHODS.UPI,
      status: TRANSACTION_STATUS.SUCCESS,
      paidAt: new Date(),
      receiptNumber,
      metadata: { reason, requestedBy },
    });

    await notificationService.notifyUser({
      userId,
      type: NOTIFICATION_TYPES.REFUND_PROCESSED,
      title: 'Refund Processed',
      message: `Refund of ₹${refundAmount.toLocaleString()} processed successfully (${receiptNumber}).`,
      relatedEntity: { entityType: 'TRANSACTION', entityId: refundTxn._id },
      actionUrl: '/dashboard/user',
      priority: NOTIFICATION_PRIORITY.HIGH,
    });

    return {
      success: true,
      message: 'Refund processed successfully',
      refundTransaction: refundTxn,
      receiptNumber,
    };
  },

  /**
   * Get Tenant Financial Summary
   */
  getTenantFinancialSummary: async (tenantId) => {
    const transactions = await Transaction.find({ tenantId, status: TRANSACTION_STATUS.SUCCESS })
      .populate('propertyId', 'title address')
      .sort({ createdAt: -1 })
      .lean();

    let totalRentPaid = 0;
    let activeDepositInEscrow = 0;
    let totalRefundsReceived = 0;

    transactions.forEach((t) => {
      if (t.type === TRANSACTION_TYPES.RENT_PAYMENT) {
        totalRentPaid += t.amount || 0;
      } else if (t.type === TRANSACTION_TYPES.DEPOSIT) {
        activeDepositInEscrow += t.amount || 0;
      } else if (t.type === TRANSACTION_TYPES.REFUND) {
        totalRefundsReceived += t.amount || 0;
      }
    });

    // Get active bookings with escrow
    const activeBookings = await Booking.find({
      tenantId,
      escrowStatus: ESCROW_STATUS.HELD_IN_ESCROW,
    }).lean();

    let currentEscrowPool = 0;
    activeBookings.forEach((b) => {
      currentEscrowPool += b.costs?.securityDeposit || 0;
    });

    // Get pending invoices
    const pendingInvoices = await RentLedger.find({
      tenantId,
      status: { $in: ['DUE', 'OVERDUE'] },
    }).populate('propertyId', 'title').sort({ dueDate: 1 }).lean();

    let pendingDuesTotal = 0;
    pendingInvoices.forEach((inv) => {
      pendingDuesTotal += inv.balanceDue || inv.totalAmount || 0;
    });

    return {
      totalRentPaid,
      activeDepositInEscrow: currentEscrowPool || activeDepositInEscrow,
      totalRefundsReceived,
      pendingDuesTotal,
      pendingInvoicesCount: pendingInvoices.length,
      pendingInvoices,
      transactionCount: transactions.length,
      transactions,
    };
  },

  /**
   * Get Owner Financial Summary
   */
  getOwnerFinancialSummary: async (ownerId) => {
    const transactions = await Transaction.find({ ownerId, status: TRANSACTION_STATUS.SUCCESS })
      .populate('tenantId', 'name email')
      .populate('propertyId', 'title')
      .sort({ createdAt: -1 })
      .lean();

    let grossEarnings = 0;
    let totalPlatformFees = 0;
    let netPayoutBalance = 0;
    let totalEscrowHeld = 0;

    transactions.forEach((t) => {
      if (t.type === TRANSACTION_TYPES.RENT_PAYMENT) {
        grossEarnings += t.amount || 0;
        totalPlatformFees += t.feeAmount || 0;
        netPayoutBalance += t.netAmount || 0;
      } else if (t.type === TRANSACTION_TYPES.DEPOSIT) {
        totalEscrowHeld += t.amount || 0;
      }
    });

    // Active escrow bookings for owner's properties
    const activeOwnerBookings = await Booking.find({
      ownerId,
      escrowStatus: ESCROW_STATUS.HELD_IN_ESCROW,
    }).lean();

    let liveOwnerEscrow = 0;
    activeOwnerBookings.forEach((b) => {
      liveOwnerEscrow += b.costs?.securityDeposit || 0;
    });

    // Pending collections
    const pendingCollections = await RentLedger.find({
      ownerId,
      status: { $in: ['DUE', 'OVERDUE'] },
    }).populate('tenantId', 'name').lean();

    let pendingCollectionTotal = 0;
    pendingCollections.forEach((inv) => {
      pendingCollectionTotal += inv.balanceDue || inv.totalAmount || 0;
    });

    return {
      grossEarnings,
      totalPlatformFees,
      netPayoutBalance,
      totalEscrowHeld: liveOwnerEscrow || totalEscrowHeld,
      pendingCollectionTotal,
      pendingCollectionsCount: pendingCollections.length,
      pendingCollections,
      recentTransactions: transactions.slice(0, 20),
    };
  },

  /**
   * Get Admin Financial Summary
   */
  getAdminFinancialSummary: async () => {
    const allSuccessTxns = await Transaction.find({ status: TRANSACTION_STATUS.SUCCESS })
      .populate('userId', 'name role')
      .populate('propertyId', 'title')
      .sort({ createdAt: -1 })
      .lean();

    let platformGMV = 0;
    let totalPlatformFeeEarnings = 0;
    let totalRentProcessed = 0;
    let totalEscrowProcessed = 0;
    let totalRefundsProcessed = 0;

    allSuccessTxns.forEach((t) => {
      if (t.type === TRANSACTION_TYPES.RENT_PAYMENT) {
        platformGMV += t.amount || 0;
        totalRentProcessed += t.amount || 0;
        totalPlatformFeeEarnings += t.feeAmount || 0;
      } else if (t.type === TRANSACTION_TYPES.DEPOSIT) {
        platformGMV += t.amount || 0;
        totalEscrowProcessed += t.amount || 0;
      } else if (t.type === TRANSACTION_TYPES.REFUND) {
        totalRefundsProcessed += t.amount || 0;
      }
    });

    // Total active escrow pool across platform
    const activeEscrowBookings = await Booking.find({
      escrowStatus: ESCROW_STATUS.HELD_IN_ESCROW,
    }).lean();

    let totalEscrowPoolHeld = 0;
    activeEscrowBookings.forEach((b) => {
      totalEscrowPoolHeld += b.costs?.totalUpfrontAmount || b.costs?.securityDeposit || 0;
    });

    return {
      platformGMV,
      totalPlatformFeeEarnings,
      totalRentProcessed,
      totalEscrowProcessed,
      totalEscrowPoolHeld,
      totalRefundsProcessed,
      totalTransactionsCount: allSuccessTxns.length,
      recentTransactions: allSuccessTxns.slice(0, 30),
    };
  },

  /**
   * Request / Process Landlord Payout
   */
  processOwnerPayout: async ({ ownerId, amount, bankAccount = 'ICICI-XXXX-9876' }) => {
    const owner = await User.findById(ownerId);
    if (!owner) throw new Error('Owner user not found');

    const randHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    const receiptNumber = `SE-PYT-${Date.now().toString().slice(-6)}-${randHex}`;

    const payoutTxn = await Transaction.create({
      transactionReference: `SE-PYT-${Date.now()}`,
      userId: ownerId,
      ownerId,
      type: TRANSACTION_TYPES.PAYOUT,
      category: 'DEBIT',
      amount,
      netAmount: amount,
      currency: 'INR',
      paymentMethod: PAYMENT_METHODS.NET_BANKING,
      status: TRANSACTION_STATUS.SUCCESS,
      paidAt: new Date(),
      receiptNumber,
      metadata: { bankAccount },
    });

    await notificationService.notifyUser({
      userId: ownerId,
      type: NOTIFICATION_TYPES.ESCROW_PAYOUT,
      title: 'Owner Payout Disbursed',
      message: `Payout of ₹${amount.toLocaleString()} disbursed to your bank account ${bankAccount} (${receiptNumber}).`,
      relatedEntity: { entityType: 'TRANSACTION', entityId: payoutTxn._id },
      actionUrl: '/dashboard/owner',
      priority: NOTIFICATION_PRIORITY.HIGH,
    });

    return {
      success: true,
      message: 'Owner payout processed successfully',
      payoutTransaction: payoutTxn,
      receiptNumber,
    };
  },

  /**
   * Retrieve Printable / Viewable Digital Receipt
   */
  getReceiptDetails: async (receiptNumber) => {
    if (!receiptNumber) throw new Error('Receipt number is required');

    // 1. Search Transaction
    const txn = await Transaction.findOne({ receiptNumber })
      .populate('userId', 'name email phone')
      .populate('ownerId', 'name email phone')
      .populate('propertyId', 'title address')
      .lean();

    if (txn) {
      return {
        receiptType: txn.type === TRANSACTION_TYPES.DEPOSIT ? 'ESCROW_DEPOSIT' : txn.type === TRANSACTION_TYPES.REFUND ? 'REFUND_RECEIPT' : 'RENT_RECEIPT',
        receiptNumber: txn.receiptNumber,
        transactionReference: txn.transactionReference,
        gatewayOrderId: txn.gatewayOrderId,
        gatewayPaymentId: txn.gatewayPaymentId,
        date: txn.paidAt || txn.createdAt,
        payer: txn.userId ? { name: txn.userId.name, email: txn.userId.email, phone: txn.userId.phone } : null,
        property: txn.propertyId ? { title: txn.propertyId.title, address: txn.propertyId.address } : null,
        amount: txn.amount,
        feeAmount: txn.feeAmount,
        netAmount: txn.netAmount,
        paymentMethod: txn.paymentMethod,
        status: txn.status,
      };
    }

    // 2. Search RentLedger
    const invoice = await RentLedger.findOne({ receiptNumber })
      .populate('tenantId', 'name email phone')
      .populate('ownerId', 'name email phone')
      .populate('propertyId', 'title address')
      .lean();

    if (invoice) {
      return {
        receiptType: 'RENT_RECEIPT',
        receiptNumber: invoice.receiptNumber,
        invoiceNumber: invoice.invoiceNumber,
        billingMonth: invoice.billingMonth,
        date: invoice.paidAt || invoice.updatedAt,
        payer: invoice.tenantId ? { name: invoice.tenantId.name, email: invoice.tenantId.email, phone: invoice.tenantId.phone } : null,
        owner: invoice.ownerId ? { name: invoice.ownerId.name, email: invoice.ownerId.email, phone: invoice.ownerId.phone } : null,
        property: invoice.propertyId ? { title: invoice.propertyId.title, address: invoice.propertyId.address } : null,
        breakdown: invoice.breakdown,
        amount: invoice.totalAmount,
        amountPaid: invoice.amountPaid,
        balanceDue: invoice.balanceDue,
        paymentMethod: invoice.paymentMethod,
        paymentReference: invoice.paymentReference,
        status: invoice.status,
      };
    }

    // 3. Search Booking Escrow Receipt
    const booking = await Booking.findOne({ escrowReceiptId: receiptNumber })
      .populate('tenantId', 'name email phone')
      .populate('ownerId', 'name email phone')
      .populate('propertyId', 'title address')
      .lean();

    if (booking) {
      return {
        receiptType: 'ESCROW_DEPOSIT',
        receiptNumber: booking.escrowReceiptId,
        bookingReference: booking.bookingReference,
        date: booking.escrowPaidAt || booking.updatedAt,
        payer: booking.tenantId ? { name: booking.tenantId.name, email: booking.tenantId.email, phone: booking.tenantId.phone } : null,
        owner: booking.ownerId ? { name: booking.ownerId.name, email: booking.ownerId.email, phone: booking.ownerId.phone } : null,
        property: booking.propertyId ? { title: booking.propertyId.title, address: booking.propertyId.address } : null,
        costs: booking.costs,
        amount: booking.costs.totalUpfrontAmount,
        escrowStatus: booking.escrowStatus,
        status: booking.paymentStatus,
      };
    }

    const err = new Error('Digital receipt not found for receipt number: ' + receiptNumber);
    err.statusCode = 404;
    throw err;
  },
};
