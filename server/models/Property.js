import mongoose from 'mongoose';
import {
  PROPERTY_TYPES,
  ROOM_TYPES,
  BED_STATUS,
  PHOTO_CATEGORIES,
  GENDER_PREFERENCE,
  TARGET_OCCUPANTS,
  VERIFICATION_STATUS,
  AVAILABILITY_STATUS,
  ELECTRICITY_BILLING,
  FOOD_OPTIONS,
} from '../constants/roles.js';

const bedSchema = new mongoose.Schema({
  bedNumber: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: Object.values(BED_STATUS),
    default: BED_STATUS.AVAILABLE,
  },
  occupiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null,
  },
  notes: {
    type: String,
    default: '',
  },
});

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    trim: true,
  },
  floor: {
    type: Number,
    default: 1,
  },
  roomType: {
    type: String,
    enum: Object.values(ROOM_TYPES),
    default: ROOM_TYPES.SINGLE,
  },
  sharingType: {
    type: String,
    default: 'SINGLE',
  },
  rent: {
    type: Number,
    required: [true, 'Rent for room is required'],
    min: [0, 'Rent cannot be negative'],
  },
  deposit: {
    type: Number,
    default: 0,
    min: [0, 'Deposit cannot be negative'],
  },
  attachedWashroom: {
    type: Boolean,
    default: true,
  },
  hasBalcony: {
    type: Boolean,
    default: false,
  },
  hasAC: {
    type: Boolean,
    default: false,
  },
  beds: [bedSchema],
  amenities: {
    type: [String],
    default: [],
  },
});

const photoSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: Object.values(PHOTO_CATEGORIES),
    default: PHOTO_CATEGORIES.GALLERY,
  },
  caption: {
    type: String,
    trim: true,
    default: '',
  },
  isCover: {
    type: Boolean,
    default: false,
  },
});

const roomConfigSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: Object.values(ROOM_TYPES),
    required: true,
  },
  name: {
    type: String,
    trim: true,
    required: true,
  },
  rent: {
    type: Number,
    required: [true, 'Rent for room configuration is required'],
    min: [0, 'Rent cannot be negative'],
  },
  deposit: {
    type: Number,
    required: [true, 'Deposit for room configuration is required'],
    min: [0, 'Deposit cannot be negative'],
  },
  totalBeds: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  availableBeds: {
    type: Number,
    required: true,
    min: 0,
    default: 1,
  },
  attachedWashroom: {
    type: Boolean,
    default: true,
  },
  hasBalcony: {
    type: Boolean,
    default: false,
  },
  hasAC: {
    type: Boolean,
    default: false,
  },
});

const propertySchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Property must belong to an owner'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Property title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
      index: true,
    },
    tagline: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      required: [true, 'Property description is required'],
      trim: true,
    },
    propertyType: {
      type: String,
      enum: Object.values(PROPERTY_TYPES),
      default: PROPERTY_TYPES.PG,
      required: true,
      index: true,
    },
    genderPreference: {
      type: String,
      enum: Object.values(GENDER_PREFERENCE),
      default: GENDER_PREFERENCE.UNISEX,
      index: true,
    },
    targetOccupants: {
      type: String,
      enum: Object.values(TARGET_OCCUPANTS),
      default: TARGET_OCCUPANTS.ANY,
    },
    address: {
      street: { type: String, trim: true, default: '' },
      city: { type: String, required: [true, 'City is required'], trim: true, index: true },
      state: { type: String, required: [true, 'State is required'], trim: true },
      pincode: { type: String, required: [true, 'Pincode is required'], trim: true },
      landmark: { type: String, trim: true, default: '' },
      coordinates: {
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 },
      },
    },
    contactPhone: {
      type: String,
      trim: true,
      default: '',
    },
    contactEmail: {
      type: String,
      trim: true,
      default: '',
    },
    coverImage: {
      type: String,
      trim: true,
      default: '',
    },
    photos: {
      type: [photoSchema],
      default: [],
    },
    images: {
      type: [String],
      validate: {
        validator: function (v) {
          return (Array.isArray(v) && v.length > 0) || (Array.isArray(this?.photos) && this?.photos.length > 0);
        },
        message: 'Please provide at least one photo of the property',
      },
    },
    rooms: {
      type: [roomSchema],
      default: [],
    },
    roomConfigurations: {
      type: [roomConfigSchema],
      validate: {
        validator: function (v) {
          return (Array.isArray(v) && v.length > 0) || (Array.isArray(this?.rooms) && this?.rooms.length > 0);
        },
        message: 'Please provide at least one room configuration',
      },
    },
    rentRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
    },
    expenses: {
      electricity: {
        type: {
          type: String,
          enum: Object.values(ELECTRICITY_BILLING),
          default: ELECTRICITY_BILLING.PER_UNIT,
        },
        rate: { type: Number, default: 8 },
        description: { type: String, default: 'Sub-metered billing (₹8/unit)' },
      },
      water: {
        type: { type: String, enum: ['INCLUDED', 'EXTRA'], default: 'INCLUDED' },
        amount: { type: Number, default: 0 },
      },
      maintenance: {
        type: { type: String, enum: ['INCLUDED', 'EXTRA'], default: 'INCLUDED' },
        amount: { type: Number, default: 0 },
      },
      food: {
        available: { type: Boolean, default: true },
        includedInRent: { type: Boolean, default: true },
        extraCost: { type: Number, default: 0 },
        foodType: {
          type: String,
          enum: Object.values(FOOD_OPTIONS),
          default: FOOD_OPTIONS.BOTH,
        },
        mealSchedule: {
          type: [String],
          default: ['Breakfast', 'Lunch', 'Dinner'],
        },
      },
      otherCharges: {
        amount: { type: Number, default: 0 },
        description: { type: String, default: 'None' },
      },
    },
    noticePeriodDays: {
      type: Number,
      default: 30,
    },
    depositRefundPolicy: {
      type: String,
      default: 'Full deposit refunded within 7 days of checkout inspection.',
    },
    allowPayAtProperty: {
      type: Boolean,
      default: false,
    },
    amenities: {
      type: [String],
      default: [
        'High-Speed WiFi',
        'Daily Housekeeping',
        'CCTV 24/7',
        'Power Backup',
        'Attached Washroom',
        'Washing Machine',
      ],
    },
    houseRules: {
      type: [String],
      default: [
        'Gate closes at 10:30 PM',
        'No smoking inside rooms',
        'Quiet hours after 11:00 PM',
        'Guests permitted in visitor lobby',
      ],
    },
    verificationStatus: {
      type: String,
      enum: Object.values(VERIFICATION_STATUS),
      default: VERIFICATION_STATUS.PENDING,
      index: true,
    },
    verificationNotes: {
      type: String,
      default: '',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    availabilityStatus: {
      type: String,
      enum: Object.values(AVAILABILITY_STATUS),
      default: AVAILABILITY_STATUS.AVAILABLE,
      index: true,
    },
    trustScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 88,
    },
    ratings: {
      overallAverage: { type: Number, default: 0 },
      foodQualityAverage: { type: Number, default: 0 },
      cleanlinessAverage: { type: Number, default: 0 },
      ownerResponsivenessAverage: { type: Number, default: 0 },
      billingTransparencyAverage: { type: Number, default: 0 },
      amenitiesAverage: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
      starDistribution: {
        1: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        5: { type: Number, default: 0 },
      },
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Pre-save hook: compute rentRange & sync rooms/roomConfigurations and photos/images
propertySchema.pre('save', function (next) {
  // Sync Photos and Images
  if (this.photos && this.photos.length > 0) {
    const photoUrls = this.photos.map((p) => p.url);
    if (!this.images || this.images.length === 0) {
      this.images = photoUrls;
    }
    const coverPhoto = this.photos.find((p) => p.isCover || p.category === PHOTO_CATEGORIES.COVER);
    if (coverPhoto) {
      this.coverImage = coverPhoto.url;
    } else if (!this.coverImage) {
      this.coverImage = this.photos[0].url;
    }
  } else if (this.images && this.images.length > 0) {
    this.photos = this.images.map((url, idx) => ({
      url,
      category: idx === 0 ? PHOTO_CATEGORIES.COVER : PHOTO_CATEGORIES.GALLERY,
      caption: '',
      isCover: idx === 0,
    }));
    if (!this.coverImage) {
      this.coverImage = this.images[0];
    }
  }

  // Sync Rooms and RoomConfigurations
  if (this.rooms && this.rooms.length > 0) {
    // If no roomConfigurations provided, derive from structured rooms
    if (!this.roomConfigurations || this.roomConfigurations.length === 0) {
      const configMap = {};
      this.rooms.forEach((r) => {
        const key = `${r.roomType || 'SINGLE'}_${r.rent}_${r.hasAC}_${r.attachedWashroom}`;
        if (!configMap[key]) {
          configMap[key] = {
            type: r.roomType || 'SINGLE',
            name: `${r.sharingType || r.roomType || 'Standard'} Room`,
            rent: r.rent,
            deposit: r.deposit || 0,
            totalBeds: 0,
            availableBeds: 0,
            attachedWashroom: r.attachedWashroom !== false,
            hasBalcony: !!r.hasBalcony,
            hasAC: !!r.hasAC,
          };
        }
        const totalBedsInRoom = r.beds && r.beds.length > 0 ? r.beds.length : 1;
        const availBedsInRoom =
          r.beds && r.beds.length > 0
            ? r.beds.filter((b) => b.status === BED_STATUS.AVAILABLE).length
            : 1;
        configMap[key].totalBeds += totalBedsInRoom;
        configMap[key].availableBeds += availBedsInRoom;
      });
      this.roomConfigurations = Object.values(configMap);
    }
  } else if (this.roomConfigurations && this.roomConfigurations.length > 0) {
    // Auto-generate default rooms and beds from roomConfigurations if rooms empty
    const generatedRooms = [];
    let roomNum = 101;
    this.roomConfigurations.forEach((rc) => {
      const totalB = rc.totalBeds || 1;
      const availB = rc.availableBeds != null ? rc.availableBeds : totalB;
      const beds = [];
      for (let i = 1; i <= totalB; i++) {
        beds.push({
          bedNumber: `Bed ${i}`,
          status: i <= availB ? BED_STATUS.AVAILABLE : BED_STATUS.OCCUPIED,
        });
      }
      generatedRooms.push({
        roomNumber: String(roomNum++),
        floor: 1,
        roomType: rc.type || 'SINGLE',
        sharingType: rc.type || 'SINGLE',
        rent: rc.rent,
        deposit: rc.deposit || 0,
        attachedWashroom: rc.attachedWashroom !== false,
        hasBalcony: !!rc.hasBalcony,
        hasAC: !!rc.hasAC,
        beds,
      });
    });
    this.rooms = generatedRooms;
  }

  // Calculate rent range
  const rents = [];
  if (this.rooms && this.rooms.length > 0) {
    this.rooms.forEach((r) => rents.push(r.rent));
  }
  if (this.roomConfigurations && this.roomConfigurations.length > 0) {
    this.roomConfigurations.forEach((rc) => rents.push(rc.rent));
  }
  if (rents.length > 0) {
    this.rentRange.min = Math.min(...rents);
    this.rentRange.max = Math.max(...rents);
  }

  next();
});

// Virtual: Total estimated transparent monthly cost
propertySchema.virtual('totalEstimatedMonthlyCost').get(function () {
  const baseMinRent = this.rentRange?.min || 0;
  let extraMonthly = 0;

  if (this.expenses) {
    if (this.expenses.water?.type === 'EXTRA') {
      extraMonthly += this.expenses.water.amount || 0;
    }
    if (this.expenses.maintenance?.type === 'EXTRA') {
      extraMonthly += this.expenses.maintenance.amount || 0;
    }
    if (this.expenses.food?.available && !this.expenses.food?.includedInRent) {
      extraMonthly += this.expenses.food.extraCost || 0;
    }
    if (this.expenses.electricity?.type === 'PER_UNIT') {
      extraMonthly += (this.expenses.electricity.rate || 8) * 60;
    } else if (this.expenses.electricity?.type === 'FIXED') {
      extraMonthly += this.expenses.electricity.rate || 0;
    }
  }

  return baseMinRent + extraMonthly;
});

// Virtual: Total available beds
propertySchema.virtual('totalAvailableBeds').get(function () {
  if (this.rooms && this.rooms.length > 0) {
    let count = 0;
    this.rooms.forEach((r) => {
      if (r.beds && r.beds.length > 0) {
        count += r.beds.filter((b) => b.status === BED_STATUS.AVAILABLE).length;
      }
    });
    return count;
  }
  if (!this.roomConfigurations || this.roomConfigurations.length === 0) return 0;
  return this.roomConfigurations.reduce((acc, curr) => acc + (curr.availableBeds || 0), 0);
});

// Virtual: Total beds
propertySchema.virtual('totalBeds').get(function () {
  if (this.rooms && this.rooms.length > 0) {
    let count = 0;
    this.rooms.forEach((r) => {
      count += r.beds && r.beds.length > 0 ? r.beds.length : 1;
    });
    return count;
  }
  if (!this.roomConfigurations || this.roomConfigurations.length === 0) return 0;
  return this.roomConfigurations.reduce((acc, curr) => acc + (curr.totalBeds || 0), 0);
});

// Virtual: Occupied beds
propertySchema.virtual('occupiedBeds').get(function () {
  const total = this.totalBeds || 0;
  const avail = this.totalAvailableBeds || 0;
  return Math.max(0, total - avail);
});

// Static method: Recalculate property ratings based on APPROVED reviews
propertySchema.statics.recalculateRatings = async function (propertyId) {
  const Review = mongoose.model('Review');
  const reviews = await Review.find({ propertyId, status: 'APPROVED' });

  if (!reviews || reviews.length === 0) {
    await this.findByIdAndUpdate(propertyId, {
      $set: {
        ratings: {
          overallAverage: 0,
          foodQualityAverage: 0,
          cleanlinessAverage: 0,
          ownerResponsivenessAverage: 0,
          billingTransparencyAverage: 0,
          amenitiesAverage: 0,
          totalReviews: 0,
          starDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
      },
    });
    return;
  }

  const count = reviews.length;
  let sumOverall = 0;
  let sumFood = 0;
  let sumClean = 0;
  let sumResp = 0;
  let sumBill = 0;
  let sumAmen = 0;
  const starDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  reviews.forEach((r) => {
    sumOverall += r.overallRating || 0;
    sumFood += r.foodQualityRating || 0;
    sumClean += r.cleanlinessRating || 0;
    sumResp += r.ownerResponsivenessRating || 0;
    sumBill += r.billingTransparencyRating || 0;
    sumAmen += r.amenitiesRating || 0;

    const roundedRating = Math.round(r.overallRating);
    if (roundedRating >= 1 && roundedRating <= 5) {
      starDist[roundedRating] = (starDist[roundedRating] || 0) + 1;
    }
  });

  const overallAvg = Number((sumOverall / count).toFixed(1));
  const foodAvg = Number((sumFood / count).toFixed(1));
  const cleanAvg = Number((sumClean / count).toFixed(1));
  const respAvg = Number((sumResp / count).toFixed(1));
  const billAvg = Number((sumBill / count).toFixed(1));
  const amenAvg = Number((sumAmen / count).toFixed(1));

  const calculatedTrustScore = Math.min(
    100,
    Math.max(50, Math.round(70 + overallAvg * 4 + foodAvg * 2))
  );

  await this.findByIdAndUpdate(propertyId, {
    $set: {
      trustScore: calculatedTrustScore,
      ratings: {
        overallAverage: overallAvg,
        foodQualityAverage: foodAvg,
        cleanlinessAverage: cleanAvg,
        ownerResponsivenessAverage: respAvg,
        billingTransparencyAverage: billAvg,
        amenitiesAverage: amenAvg,
        totalReviews: count,
        starDistribution: starDist,
      },
    },
  });
};

export const Property = mongoose.model('Property', propertySchema);


