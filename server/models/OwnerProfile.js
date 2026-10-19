import mongoose from 'mongoose';
import { VERIFICATION_STATUS } from '../constants/roles.js';

const ownerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      trim: true,
      default: '',
    },
    govtIdType: {
      type: String,
      enum: ['AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENSE', 'GST', 'OTHER'],
      default: 'PAN',
    },
    govtIdNumber: {
      type: String,
      trim: true,
      default: '',
    },
    verificationStatus: {
      type: String,
      enum: Object.values(VERIFICATION_STATUS),
      default: VERIFICATION_STATUS.PENDING,
    },
    verificationNotes: {
      type: String,
      default: '',
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    emergencyContact: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      street: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      pincode: { type: String, trim: true, default: '' },
    },
    propertiesCount: {
      type: Number,
      default: 0,
    },
    isTrustPledgeSigned: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const OwnerProfile = mongoose.model('OwnerProfile', ownerProfileSchema);
