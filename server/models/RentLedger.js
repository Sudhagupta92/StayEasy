import mongoose from 'mongoose';

const rentLedgerSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      index: true,
    },
    receiptNumber: {
      type: String,
      default: '',
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Rent invoice must be linked to a booking'],
      index: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Rent invoice must be linked to a property'],
      index: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Rent invoice must belong to a tenant'],
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Rent invoice must belong to an owner'],
      index: true,
    },
    billingMonth: {
      type: String,
      required: [true, 'Billing month is required'],
      trim: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Invoice due date is required'],
    },
    breakdown: {
      baseRent: {
        type: Number,
        required: true,
        min: 0,
      },
      electricity: {
        previousMeterReading: { type: Number, default: 0 },
        currentMeterReading: { type: Number, default: 0 },
        unitsConsumed: { type: Number, default: 0 },
        ratePerUnit: { type: Number, default: 0 },
        amount: { type: Number, default: 0 },
        description: { type: String, default: 'Sub-metered electricity' },
      },
      waterCharges: { type: Number, default: 0 },
      maintenanceCharges: { type: Number, default: 0 },
      foodCharges: { type: Number, default: 0 },
      otherCharges: { type: Number, default: 0 },
      otherChargesDescription: { type: String, default: '' },
      lateFee: { type: Number, default: 0 },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceDue: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['DUE', 'PAID', 'OVERDUE', 'PARTIALLY_PAID', 'CANCELLED'],
      default: 'DUE',
      index: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    paymentMethod: {
      type: String,
      default: '',
    },
    paymentReference: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
    noticeDetails: {
      isNoticeServed: { type: Boolean, default: false },
      noticeDate: { type: Date, default: null },
      intendedCheckoutDate: { type: Date, default: null },
      reason: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save hook: auto-generate unique invoice & receipt numbers
rentLedgerSchema.pre('save', function (next) {
  if (!this.invoiceNumber) {
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const randHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.invoiceNumber = `SE-INV-${yearMonth}-${randHex}`;
  }

  if (this.status === 'PAID' && !this.receiptNumber) {
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    const randHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.receiptNumber = `SE-RCT-${yearMonth}-${randHex}`;
  }

  // Auto calculate balanceDue
  this.balanceDue = Math.max(0, this.totalAmount - this.amountPaid);

  next();
});

export const RentLedger = mongoose.model('RentLedger', rentLedgerSchema);
