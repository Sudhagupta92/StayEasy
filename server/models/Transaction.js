import mongoose from 'mongoose';
import { TRANSACTION_TYPES, TRANSACTION_STATUS, PAYMENT_METHODS } from '../constants/roles.js';

const transactionSchema = new mongoose.Schema(
  {
    transactionReference: {
      type: String,
      unique: true,
      index: true,
    },
    gatewayOrderId: {
      type: String,
      index: true,
    },
    gatewayPaymentId: {
      type: String,
      default: '',
    },
    gatewaySignature: {
      type: String,
      default: '',
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      index: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RentLedger',
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(TRANSACTION_TYPES),
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['CREDIT', 'DEBIT'],
      default: 'DEBIT',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    feeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    netAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      default: PAYMENT_METHODS.UPI,
    },
    paymentGateway: {
      type: String,
      default: 'RAZORPAY_MOCK',
    },
    status: {
      type: String,
      enum: Object.values(TRANSACTION_STATUS),
      default: TRANSACTION_STATUS.CREATED,
      index: true,
    },
    failureReason: {
      type: String,
      default: '',
    },
    receiptNumber: {
      type: String,
      default: '',
    },
    paidAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save hook for transaction reference and net amount
transactionSchema.pre('save', function (next) {
  if (!this.transactionReference) {
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const randHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.transactionReference = `SE-TXN-${yearMonth}-${randHex}`;
  }

  if (typeof this.netAmount !== 'number' || this.netAmount === 0) {
    this.netAmount = Math.max(0, this.amount - (this.feeAmount || 0));
  }

  next();
});

export const Transaction = mongoose.model('Transaction', transactionSchema);
