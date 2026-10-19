import mongoose from 'mongoose';
import { REVIEW_STATUS } from '../constants/roles.js';

const reviewSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property ID is required'],
      index: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Tenant ID is required'],
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
      unique: true,
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Review title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      minlength: [10, 'Review comment must be at least 10 characters long'],
      maxlength: [2000, 'Review comment cannot exceed 2000 characters'],
    },
    overallRating: {
      type: Number,
      required: [true, 'Overall rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    foodQualityRating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
    cleanlinessRating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
    ownerResponsivenessRating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
    billingTransparencyRating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
    amenitiesRating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
    promiseVsRealityScore: {
      type: Number,
      default: 8,
      min: 1,
      max: 10,
    },
    pros: {
      type: [String],
      default: [],
    },
    cons: {
      type: [String],
      default: [],
    },
    roomTypeStayed: {
      type: String,
      default: 'SINGLE',
    },
    roomName: {
      type: String,
      default: '',
    },
    isVerifiedResident: {
      type: Boolean,
      default: true,
      index: true,
    },
    stayDurationDays: {
      type: Number,
      default: 0,
    },
    isCurrentResident: {
      type: Boolean,
      default: false,
    },
    checkInDate: {
      type: Date,
      default: null,
    },
    checkOutDate: {
      type: Date,
      default: null,
    },
    stayDurationText: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(REVIEW_STATUS),
      default: REVIEW_STATUS.APPROVED,
      index: true,
    },
    helpfulVotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    unhelpfulVotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    ownerResponse: {
      responseText: { type: String, default: '' },
      respondedAt: { type: Date, default: null },
    },
    flags: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    isModerated: {
      type: Boolean,
      default: false,
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    moderatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: total helpful count
reviewSchema.virtual('helpfulCount').get(function () {
  return this.helpfulVotes ? this.helpfulVotes.length : 0;
});

export const Review = mongoose.model('Review', reviewSchema);
