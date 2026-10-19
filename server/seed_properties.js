import dns from 'node:dns';
import mongoose from 'mongoose';
import { ENV } from './config/env.js';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {}
import { User } from './models/User.js';
import { OwnerProfile } from './models/OwnerProfile.js';
import { Property } from './models/Property.js';
import {
  ROLES,
  PROPERTY_TYPES,
  ROOM_TYPES,
  GENDER_PREFERENCE,
  VERIFICATION_STATUS,
  AVAILABILITY_STATUS,
  ELECTRICITY_BILLING,
  FOOD_OPTIONS,
} from './constants/roles.js';

export const seedProperties = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(ENV.MONGODB_URI, { dbName: 'stayeasy' });
      console.log('[Seed] Connected to MongoDB for seeding properties...');
    }


    // Find or create a verified sample landlord safely (idempotent with duplicate key protection)
    let sampleOwner = await User.findOne({ email: 'owner.greenwood@stayeasy.local' });
    if (!sampleOwner) {
      try {
        sampleOwner = await User.create({
          name: 'Venkatesh Rao',
          email: 'owner.greenwood@stayeasy.local',
          password: 'Password123!',
          role: ROLES.OWNER,
          phone: '9876543210',
          isVerified: true,
        });
      } catch (userErr) {
        if (userErr.code === 11000) {
          sampleOwner = await User.findOne({ email: 'owner.greenwood@stayeasy.local' });
        } else {
          throw userErr;
        }
      }
    }

    // Safely upsert OwnerProfile without duplicate key error on userId
    await OwnerProfile.findOneAndUpdate(
      { userId: sampleOwner._id },
      {
        $setOnInsert: {
          businessName: 'Greenwood Hospitality Group',
          verificationStatus: VERIFICATION_STATUS.VERIFIED,
          emergencyContact: '9876543299',
          address: { city: 'Bengaluru', state: 'Karnataka' },
          isTrustPledgeSigned: true,
        },
      },
      { upsert: true, new: true }
    );

    const propertiesToSeed = [
      {
        ownerId: sampleOwner._id,
        title: 'Greenwood Luxury Student Living & Co-Living',
        tagline: 'Premium Air-Conditioned Co-Living with 3-Time Nutritious Meals',
        description:
          'Modern co-living space specifically designed for college students and tech professionals. High-speed 300 Mbps fiber internet, ergonomic study desks, biometric security entry, and chef-curated buffet meals 3 times a day.',
        propertyType: PROPERTY_TYPES.PG,
        genderPreference: GENDER_PREFERENCE.UNISEX,
        address: {
          street: '14th Main, 4th Block, Near Sony World Signal',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560034',
          landmark: 'Opposite Christ University Junior College',
          coordinates: { lat: 12.9352, lng: 77.6245 },
        },
        images: [
          'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
        ],
        roomConfigurations: [
          {
            type: ROOM_TYPES.SINGLE,
            name: 'Deluxe Private Single AC Room',
            rent: 16500,
            deposit: 25000,
            totalBeds: 10,
            availableBeds: 3,
            attachedWashroom: true,
            hasBalcony: true,
            hasAC: true,
          },
          {
            type: ROOM_TYPES.DOUBLE,
            name: '2-Seater Premium Sharing Room',
            rent: 11500,
            deposit: 18000,
            totalBeds: 24,
            availableBeds: 6,
            attachedWashroom: true,
            hasBalcony: false,
            hasAC: true,
          },
          {
            type: ROOM_TYPES.TRIPLE,
            name: '3-Seater Budget Sharing Room',
            rent: 8500,
            deposit: 12000,
            totalBeds: 18,
            availableBeds: 4,
            attachedWashroom: true,
            hasBalcony: false,
            hasAC: false,
          },
        ],
        expenses: {
          electricity: {
            type: ELECTRICITY_BILLING.PER_UNIT,
            rate: 8,
            description: 'Sub-metered billing at government slab rate (₹8/unit)',
          },
          water: { type: 'INCLUDED', amount: 0 },
          maintenance: { type: 'INCLUDED', amount: 0 },
          food: {
            available: true,
            includedInRent: true,
            extraCost: 0,
            foodType: FOOD_OPTIONS.BOTH,
            mealSchedule: ['Breakfast', 'Lunch', 'Dinner'],
          },
          otherCharges: { amount: 0, description: 'Zero Brokerage' },
        },
        noticePeriodDays: 30,
        depositRefundPolicy: 'Full refund settled directly to bank account within 5 working days of checkout.',
        amenities: [
          'High-Speed WiFi',
          '3-Time Buffet Meals',
          'Daily Housekeeping',
          'Biometric Security',
          'Gym Access',
          'Power Backup 24/7',
          'RO Mineral Water',
          'Washing Machine',
        ],
        houseRules: [
          'Entry gate closes at 11:00 PM',
          'No smoking or alcohol inside premises',
          'Guests allowed in reception lounge',
        ],
        verificationStatus: VERIFICATION_STATUS.VERIFIED,
        availabilityStatus: AVAILABILITY_STATUS.AVAILABLE,
        trustScore: 95,
        isFeatured: true,
      },
      {
        ownerId: sampleOwner._id,
        title: 'MetroNest Executive Hostel for Professionals',
        tagline: 'Quiet, Work-From-Home Friendly Living in Hitec City',
        description:
          'Located in the heart of Hyderabad IT corridor. Dedicated workspace, uninterrupted power backup, high-speed dual-band WiFi, and quiet floor zones for working professionals.',
        propertyType: PROPERTY_TYPES.HOSTEL,
        genderPreference: GENDER_PREFERENCE.MALE,
        address: {
          street: 'Phase 2, Madhapur',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500081',
          landmark: '5 Mins from Cyber Towers & Inorbit Mall',
          coordinates: { lat: 17.4483, lng: 78.3915 },
        },
        images: [
          'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80',
        ],
        roomConfigurations: [
          {
            type: ROOM_TYPES.SINGLE,
            name: 'Executive Studio Room',
            rent: 14000,
            deposit: 20000,
            totalBeds: 8,
            availableBeds: 2,
            attachedWashroom: true,
            hasBalcony: true,
            hasAC: true,
          },
          {
            type: ROOM_TYPES.DOUBLE,
            name: '2-Seater Executive Sharing',
            rent: 9500,
            deposit: 15000,
            totalBeds: 20,
            availableBeds: 5,
            attachedWashroom: true,
            hasBalcony: false,
            hasAC: true,
          },
        ],
        expenses: {
          electricity: {
            type: ELECTRICITY_BILLING.FIXED,
            rate: 600,
            description: 'Fixed ₹600/month for AC maintenance & power',
          },
          water: { type: 'INCLUDED', amount: 0 },
          maintenance: { type: 'INCLUDED', amount: 0 },
          food: {
            available: true,
            includedInRent: true,
            extraCost: 0,
            foodType: FOOD_OPTIONS.BOTH,
            mealSchedule: ['Breakfast', 'Dinner', 'Weekend Lunch'],
          },
          otherCharges: { amount: 0, description: 'None' },
        },
        noticePeriodDays: 30,
        depositRefundPolicy: '100% Deposit Refund record with same-day exit clearance.',
        amenities: [
          '100% Power Backup',
          'High-Speed WiFi',
          'Attached Washroom',
          'CCTV 24/7',
          'Laundry Service',
          'Covered Bike Parking',
        ],
        houseRules: [
          'No loud music after 10:30 PM',
          'Keycard entry 24/7',
        ],
        verificationStatus: VERIFICATION_STATUS.VERIFIED,
        availabilityStatus: AVAILABILITY_STATUS.AVAILABLE,
        trustScore: 92,
        isFeatured: true,
      },
      {
        ownerId: sampleOwner._id,
        title: 'Serene Heights Premium Girls Residency',
        tagline: 'Safe, Homely & Hygienic Living with Female Warden 24/7',
        description:
          'Premier girls PG near Delhi University North Campus. Female warden on site 24/7, fingerprint biometric locks, home-style fresh vegetarian meals, and peaceful study rooms.',
        propertyType: PROPERTY_TYPES.PG,
        genderPreference: GENDER_PREFERENCE.FEMALE,
        address: {
          street: 'Hudson Lane, GTB Nagar',
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110009',
          landmark: '300m from Delhi University Metro Gate 3',
          coordinates: { lat: 28.6988, lng: 77.2062 },
        },
        images: [
          'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80',
        ],
        roomConfigurations: [
          {
            type: ROOM_TYPES.SINGLE,
            name: 'Private Room with Balcony',
            rent: 17500,
            deposit: 25000,
            totalBeds: 6,
            availableBeds: 1,
            attachedWashroom: true,
            hasBalcony: true,
            hasAC: true,
          },
          {
            type: ROOM_TYPES.DOUBLE,
            name: '2-Seater Deluxe Twin',
            rent: 13000,
            deposit: 20000,
            totalBeds: 16,
            availableBeds: 4,
            attachedWashroom: true,
            hasBalcony: false,
            hasAC: true,
          },
        ],
        expenses: {
          electricity: {
            type: ELECTRICITY_BILLING.PER_UNIT,
            rate: 9,
            description: 'Sub-metered (₹9 / unit)',
          },
          water: { type: 'INCLUDED', amount: 0 },
          maintenance: { type: 'INCLUDED', amount: 0 },
          food: {
            available: true,
            includedInRent: true,
            extraCost: 0,
            foodType: FOOD_OPTIONS.VEG,
            mealSchedule: ['Breakfast', 'Lunch', 'Evening Tea', 'Dinner'],
          },
          otherCharges: { amount: 0, description: 'None' },
        },
        noticePeriodDays: 30,
        depositRefundPolicy: 'Instant settlement within 3 days.',
        amenities: [
          '24/7 Female Warden',
          'Fingerprint Biometric Lock',
          'RO Mineral Water',
          'Study Desks & Bookshelf',
          'Full Power Backup',
          'CCTV on all corridors',
        ],
        houseRules: [
          'Night curfew: 10:00 PM',
          'Parent / guardian visits allowed on weekends',
        ],
        verificationStatus: VERIFICATION_STATUS.VERIFIED,
        availabilityStatus: AVAILABILITY_STATUS.AVAILABLE,
        trustScore: 98,
        isFeatured: true,
      },
      {
        ownerId: sampleOwner._id,
        title: 'Koregaon Park Co-Living & Shared Flat',
        tagline: 'Chic 3-BHK Furnished Apartment with Designer Interiors',
        description:
          'Fully furnished luxury flat with modular kitchen, microwave, automatic washing machine, and spacious living room in Pune trendy Koregaon Park.',
        propertyType: PROPERTY_TYPES.CO_LIVING,
        genderPreference: GENDER_PREFERENCE.UNISEX,
        address: {
          street: 'Lane 7, Koregaon Park',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411001',
          landmark: 'Near German Bakery & Osho Garden',
          coordinates: { lat: 18.5362, lng: 73.894 },
        },
        images: [
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
        ],
        roomConfigurations: [
          {
            type: ROOM_TYPES.SINGLE,
            name: 'Master Bedroom with Ensuite Bath',
            rent: 19000,
            deposit: 35000,
            totalBeds: 2,
            availableBeds: 1,
            attachedWashroom: true,
            hasBalcony: true,
            hasAC: true,
          },
          {
            type: ROOM_TYPES.DOUBLE,
            name: 'Twin Sharing Room',
            rent: 11000,
            deposit: 20000,
            totalBeds: 4,
            availableBeds: 2,
            attachedWashroom: true,
            hasBalcony: false,
            hasAC: true,
          },
        ],
        expenses: {
          electricity: {
            type: ELECTRICITY_BILLING.PER_UNIT,
            rate: 8.5,
            description: 'Actual electricity bill divided equally amongst flatmates',
          },
          water: { type: 'INCLUDED', amount: 0 },
          maintenance: { type: 'INCLUDED', amount: 0 },
          food: {
            available: false,
            includedInRent: false,
            extraCost: 0,
            foodType: FOOD_OPTIONS.NONE,
            mealSchedule: [],
          },
          otherCharges: { amount: 0, description: 'Gas Pipeline Bill Shared' },
        },
        noticePeriodDays: 30,
        depositRefundPolicy: 'Standard 7-day post-inspection bank transfer.',
        amenities: [
          'Modular Kitchen',
          'Refrigerator',
          'Microwave',
          'Automatic Washing Machine',
          '300 Mbps WiFi',
          'Smart TV with Netflix',
        ],
        houseRules: [
          'Clean up shared kitchen after use',
          'Respect flatmates work timings',
        ],
        verificationStatus: VERIFICATION_STATUS.VERIFIED,
        availabilityStatus: AVAILABILITY_STATUS.AVAILABLE,
        trustScore: 94,
        isFeatured: true,
      },
      {
        ownerId: sampleOwner._id,
        title: 'Bandra West Modern 1BHK / Private Rooms',
        tagline: 'Boutique Private Rooms in Mumbai Most Vibrant Neighborhood',
        description:
          'Steps away from Carter Road and Hill Road. Fully air-conditioned boutique rooms with daily housekeeping, private high-speed Wi-Fi, and 24/7 security.',
        propertyType: PROPERTY_TYPES.FLAT,
        genderPreference: GENDER_PREFERENCE.UNISEX,
        address: {
          street: 'Off Carter Road, Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400050',
          landmark: '2 Mins Walk to Carter Road Promenade',
          coordinates: { lat: 19.0607, lng: 72.8258 },
        },
        images: [
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
        ],
        roomConfigurations: [
          {
            type: ROOM_TYPES.FLAT_FULL,
            name: 'Complete 1-BHK Furnished Apartment',
            rent: 32000,
            deposit: 50000,
            totalBeds: 2,
            availableBeds: 2,
            attachedWashroom: true,
            hasBalcony: true,
            hasAC: true,
          },
          {
            type: ROOM_TYPES.SINGLE,
            name: 'Private Studio Room',
            rent: 22000,
            deposit: 35000,
            totalBeds: 2,
            availableBeds: 1,
            attachedWashroom: true,
            hasBalcony: false,
            hasAC: true,
          },
        ],
        expenses: {
          electricity: {
            type: ELECTRICITY_BILLING.PER_UNIT,
            rate: 10,
            description: 'Direct Tata Power sub-meter billing',
          },
          water: { type: 'INCLUDED', amount: 0 },
          maintenance: { type: 'INCLUDED', amount: 0 },
          food: {
            available: false,
            includedInRent: false,
            extraCost: 0,
            foodType: FOOD_OPTIONS.NONE,
            mealSchedule: [],
          },
          otherCharges: { amount: 0, description: 'None' },
        },
        noticePeriodDays: 30,
        depositRefundPolicy: 'Escrow guaranteed refund within 5 days.',
        amenities: [
          'High-Speed WiFi',
          'Air Conditioning',
          'Daily Housekeeping',
          'CCTV 24/7',
          'Lift Access',
          'Intercom',
        ],
        houseRules: [
          'No late night parties',
          'Quiet hours after 11 PM',
        ],
        verificationStatus: VERIFICATION_STATUS.VERIFIED,
        availabilityStatus: AVAILABILITY_STATUS.AVAILABLE,
        trustScore: 96,
        isFeatured: true,
      },
    ];

    let createdCount = 0;
    for (const prop of propertiesToSeed) {
      // Find by title to prevent duplicate demo listings even if ownerId changed
      let existingProp = await Property.findOne({ title: prop.title });

      if (!existingProp) {
        await Property.create(prop);
        createdCount++;
      } else if (String(existingProp.ownerId) !== String(sampleOwner._id)) {
        existingProp.ownerId = sampleOwner._id;
        await existingProp.save();
      }
    }

    const totalOwnerProperties = await Property.countDocuments({ ownerId: sampleOwner._id });
    await OwnerProfile.findOneAndUpdate(
      { userId: sampleOwner._id },
      { propertiesCount: totalOwnerProperties }
    );

    if (createdCount > 0) {
      console.log(`[Seed] Successfully seeded ${createdCount} new verified properties (${totalOwnerProperties} total available).`);
    } else {
      console.log(`[Seed] Demo properties are already up to date (${totalOwnerProperties} verified properties in database).`);
    }
  } catch (error) {
    console.error('[Seed Error] Seeding properties failed:', error.message);
  }
};

// Only invoke directly if executed from CLI
if (process.argv[1] && process.argv[1].includes('seed_properties')) {
  (async () => {
    try {
      await seedProperties();
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('CLI Seed Error:', err.message);
      process.exit(1);
    }
  })();
}
