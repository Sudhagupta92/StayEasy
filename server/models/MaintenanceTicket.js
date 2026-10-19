import mongoose from 'mongoose';
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  SLA_CONFIG,
} from '../constants/roles.js';

const timelineEventSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: Object.values(TICKET_STATUSES),
      required: true,
    },
    actionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actionByName: {
      type: String,
      default: 'System User',
    },
    actionRole: {
      type: String,
      default: 'USER',
    },
    notes: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const maintenanceTicketSchema = new mongoose.Schema(
  {
    ticketReference: {
      type: String,
      unique: true,
      index: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Tenant ID is required'],
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required'],
      index: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property ID is required'],
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
      index: true,
    },
    category: {
      type: String,
      enum: Object.values(TICKET_CATEGORIES),
      required: [true, 'Ticket category is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Ticket title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Ticket description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    priority: {
      type: String,
      enum: Object.values(TICKET_PRIORITIES),
      default: TICKET_PRIORITIES.MEDIUM,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(TICKET_STATUSES),
      default: TICKET_STATUSES.OPEN,
      index: true,
    },
    attachments: {
      type: [String],
      default: [],
    },
    ownerResponse: {
      type: String,
      default: '',
      trim: true,
    },
    resolutionNotes: {
      type: String,
      default: '',
      trim: true,
    },
    assignedTo: {
      type: String,
      default: '',
      trim: true,
    },
    // Timestamps for SLA tracking
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    reopenedAt: {
      type: Date,
      default: null,
    },
    // SLA fields
    responseDeadline: {
      type: Date,
      required: true,
      index: true,
    },
    resolutionDeadline: {
      type: Date,
      required: true,
      index: true,
    },
    responseBreached: {
      type: Boolean,
      default: false,
      index: true,
    },
    resolutionBreached: {
      type: Boolean,
      default: false,
      index: true,
    },
    responseDurationHours: {
      type: Number,
      default: null,
    },
    resolutionDurationHours: {
      type: Number,
      default: null,
    },
    timeline: [timelineEventSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound Indexes for fast dashboard filtering and SLA tracking
maintenanceTicketSchema.index({ ownerId: 1, status: 1, createdAt: -1 });
maintenanceTicketSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
maintenanceTicketSchema.index({ propertyId: 1, status: 1 });
maintenanceTicketSchema.index({ status: 1, priority: 1 });
maintenanceTicketSchema.index({ responseDeadline: 1, responseBreached: 1 });
maintenanceTicketSchema.index({ resolutionDeadline: 1, resolutionBreached: 1 });

// Helper to compute SLA deadlines based on created date and priority
maintenanceTicketSchema.pre('validate', function (next) {
  if (!this.ticketReference) {
    const randHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.ticketReference = `SE-TKT-${randHex}`;
  }

  const sla = SLA_CONFIG[this.priority] || SLA_CONFIG.MEDIUM;
  const baseTime = this.createdAt ? new Date(this.createdAt) : new Date();

  if (!this.responseDeadline) {
    this.responseDeadline = new Date(baseTime.getTime() + sla.responseHours * 60 * 60 * 1000);
  }

  if (!this.resolutionDeadline) {
    this.resolutionDeadline = new Date(baseTime.getTime() + sla.resolutionHours * 60 * 60 * 1000);
  }

  next();
});

// Dynamic Virtuals for real-time SLA breach evaluation
maintenanceTicketSchema.virtual('isResponseOverdue').get(function () {
  if (this.acknowledgedAt) {
    return this.acknowledgedAt > this.responseDeadline;
  }
  if (this.status === TICKET_STATUSES.OPEN) {
    return new Date() > this.responseDeadline;
  }
  return false;
});

maintenanceTicketSchema.virtual('isResolutionOverdue').get(function () {
  if (this.resolvedAt) {
    return this.resolvedAt > this.resolutionDeadline;
  }
  if (
    this.status !== TICKET_STATUSES.RESOLVED &&
    this.status !== TICKET_STATUSES.CLOSED
  ) {
    return new Date() > this.resolutionDeadline;
  }
  return false;
});

export const MaintenanceTicket = mongoose.model('MaintenanceTicket', maintenanceTicketSchema);
