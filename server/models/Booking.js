import mongoose from 'mongoose';
import { BOOKING_STATUS, PAYMENT_STATUS, ESCROW_STATUS, ROOM_TYPES, PAYMENT_METHODS } from '../constants/roles.js';

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      unique: true,
      index: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking must belong to a tenant'],
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking must belong to a property owner'],
      index: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Booking must be associated with a property'],
      index: true,
    },
    roomConfigId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Room configuration ID is required'],
    },
    roomType: {
      type: String,
      enum: Object.values(ROOM_TYPES),
      required: true,
    },
    roomName: {
      type: String,
      required: true,
      trim: true,
    },
    moveInDate: {
      type: Date,
      required: [true, 'Move-in date is required'],
    },
    durationMonths: {
      type: Number,
      default: 1,
      min: [1, 'Duration must be at least 1 month'],
    },
    costs: {
      monthlyRent: { type: Number, required: true },
      securityDeposit: { type: Number, required: true },
      foodCharges: { type: Number, default: 0 },
      electricityEstimate: { type: Number, default: 0 },
      maintenanceCharges: { type: Number, default: 0 },
      totalUpfrontAmount: { type: Number, required: true },
    },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.REQUESTED,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      default: PAYMENT_METHODS.UPI,
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },
    escrowStatus: {
      type: String,
      enum: Object.values(ESCROW_STATUS),
      default: ESCROW_STATUS.PENDING_PAYMENT,
      index: true,
    },
    escrowReceiptId: {
      type: String,
      default: '',
    },
    escrowPaidAt: {
      type: Date,
      default: null,
    },
    escrowSettlement: {
      damageDeductionAmount: { type: Number, default: 0 },
      deductionReason: { type: String, default: '' },
      tenantRefundAmount: { type: Number, default: 0 },
      ownerPayoutAmount: { type: Number, default: 0 },
      settledAt: { type: Date, default: null },
      settledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
    isVerifiedResident: {
      type: Boolean,
      default: false,
      index: true,
    },
    checkInDate: {
      type: Date,
      default: null,
    },
    checkOutDate: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    ownerNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save hook: generate unique booking reference & escrow receipt ID
bookingSchema.pre('save', function (next) {
  if (!this.bookingReference) {
    const randHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.bookingReference = `SE-BK-${randHex}`;
  }

  if (this.escrowStatus === ESCROW_STATUS.HELD_IN_ESCROW && !this.escrowReceiptId) {
    const receiptHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.escrowReceiptId = `ESCROW-REC-${receiptHex}`;
  }

  // If status is CHECKED_IN or ACTIVE_STAY, automatically mark isVerifiedResident as true
  if (
    this.status === BOOKING_STATUS.CHECKED_IN ||
    this.status === BOOKING_STATUS.ACTIVE_STAY ||
    this.status === BOOKING_STATUS.CHECKED_OUT
  ) {
    this.isVerifiedResident = true;
  }

  next();
});

export const Booking = mongoose.model('Booking', bookingSchema);
