import { Property } from '../models/Property.js';
import { OwnerProfile } from '../models/OwnerProfile.js';
import { User } from '../models/User.js';
import { Booking } from '../models/Booking.js';
import { RentLedger } from '../models/RentLedger.js';
import { MaintenanceTicket } from '../models/MaintenanceTicket.js';
import { Review } from '../models/Review.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { validatePropertyInput } from '../validators/property.validator.js';
import {
  ROLES,
  VERIFICATION_STATUS,
  BED_STATUS,
  PHOTO_CATEGORIES,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITY,
} from '../constants/roles.js';
import { notificationService } from '../services/notificationService.js';

/**
 * @desc    Get all properties with multi-facet filters, search, sorting & pagination
 * @route   GET /api/v1/properties
 * @access  Public
 */
export const getProperties = async (req, res, next) => {
  try {
    const {
      search,
      city,
      propertyType,
      genderPreference,
      targetOccupants,
      minRent,
      maxRent,
      minTotalCost,
      maxTotalCost,
      roomType,
      hasAC,
      attachedWashroom,
      hasBalcony,
      foodAvailable,
      foodIncluded,
      foodType,
      electricityType,
      amenities,
      sort,
      page = 1,
      limit = 12,
      includeUnverified,
    } = req.query;

    const query = {};

    // By default, public search shows VERIFIED listings (or all if specified)
    if (includeUnverified !== 'true') {
      query.verificationStatus = { $in: [VERIFICATION_STATUS.VERIFIED, VERIFICATION_STATUS.PENDING] };
    }

    // Keyword Search
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: regex },
        { description: regex },
        { tagline: regex },
        { 'address.city': regex },
        { 'address.landmark': regex },
        { 'address.street': regex },
      ];
    }

    // City Filter
    if (city && city.trim() && city.toUpperCase() !== 'ALL') {
      query['address.city'] = new RegExp(`^${city.trim()}$`, 'i');
    }

    // Property Type Filter
    if (propertyType && propertyType.trim() && propertyType.toUpperCase() !== 'ALL') {
      query.propertyType = propertyType.toUpperCase();
    }

    // Gender Preference Filter
    if (genderPreference && genderPreference.trim() && genderPreference.toUpperCase() !== 'ALL') {
      query.genderPreference = genderPreference.toUpperCase();
    }

    // Target Occupants Filter
    if (targetOccupants && targetOccupants.trim() && targetOccupants.toUpperCase() !== 'ALL') {
      query.targetOccupants = { $in: [targetOccupants.toUpperCase(), 'ANY'] };
    }

    // Rent Range Filter
    if (minRent || maxRent) {
      query['rentRange.min'] = {};
      if (minRent) query['rentRange.min'].$gte = Number(minRent);
      if (maxRent) query['rentRange.min'].$lte = Number(maxRent);
    }

    // Room Sharing Type Filter
    if (roomType && roomType.trim() && roomType.toUpperCase() !== 'ALL') {
      query['roomConfigurations.type'] = roomType.toUpperCase();
    }

    // Room Feature Filters (AC, Washroom, Balcony)
    if (hasAC === 'true') {
      query['roomConfigurations.hasAC'] = true;
    }
    if (attachedWashroom === 'true') {
      query['roomConfigurations.attachedWashroom'] = true;
    }
    if (hasBalcony === 'true') {
      query['roomConfigurations.hasBalcony'] = true;
    }

    // Food Filters
    if (foodAvailable === 'true') {
      query['expenses.food.available'] = true;
    }
    if (foodIncluded === 'true') {
      query['expenses.food.includedInRent'] = true;
    }
    if (foodType && foodType.trim() && foodType.toUpperCase() !== 'ALL') {
      query['expenses.food.foodType'] = foodType.toUpperCase();
    }

    // Electricity Billing Model Filter
    if (electricityType && electricityType.trim() && electricityType.toUpperCase() !== 'ALL') {
      query['expenses.electricity.type'] = electricityType.toUpperCase();
    }

    // Amenities Filter (Matches any of the selected amenities)
    if (amenities) {
      const amenitiesList = Array.isArray(amenities)
        ? amenities
        : amenities.split(',').map((a) => a.trim()).filter(Boolean);
      if (amenitiesList.length > 0) {
        query.amenities = { $in: amenitiesList };
      }
    }

    // Sorting
    let sortOption = { createdAt: -1 }; // default newest
    if (sort === 'rent_asc' || sort === 'cost_asc') sortOption = { 'rentRange.min': 1 };
    else if (sort === 'rent_desc' || sort === 'cost_desc') sortOption = { 'rentRange.min': -1 };
    else if (sort === 'trust') sortOption = { trustScore: -1 };
    else if (sort === 'newest') sortOption = { createdAt: -1 };

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    let properties = await Property.find(query)
      .populate('ownerId', 'name email phone avatar isVerified')
      .sort(sortOption);

    // Apply Total Estimated Monthly Cost filter if requested (via virtual totalEstimatedMonthlyCost)
    if (minTotalCost || maxTotalCost) {
      const minCostNum = minTotalCost ? Number(minTotalCost) : 0;
      const maxCostNum = maxTotalCost ? Number(maxTotalCost) : Infinity;

      properties = properties.filter((p) => {
        const cost = p.totalEstimatedMonthlyCost || p.rentRange?.min || 0;
        return cost >= minCostNum && cost <= maxCostNum;
      });
    }

    // Apply Total Estimated Cost Sorting if cost_asc or cost_desc specified
    if (sort === 'cost_asc') {
      properties.sort((a, b) => (a.totalEstimatedMonthlyCost || 0) - (b.totalEstimatedMonthlyCost || 0));
    } else if (sort === 'cost_desc') {
      properties.sort((a, b) => (b.totalEstimatedMonthlyCost || 0) - (a.totalEstimatedMonthlyCost || 0));
    }

    const total = properties.length;
    const paginatedProperties = properties.slice(skip, skip + limitNum);

    return successResponse(
      res,
      'Properties fetched successfully',
      {
        properties: paginatedProperties,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1,
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dynamic metadata for filter UI options (cities, price bounds, amenities)
 * @route   GET /api/v1/properties/filters/meta
 * @access  Public
 */
export const getPropertyFilterMeta = async (req, res, next) => {
  try {
    const baseQuery = {
      verificationStatus: { $in: [VERIFICATION_STATUS.VERIFIED, VERIFICATION_STATUS.PENDING] },
    };

    const properties = await Property.find(baseQuery);

    const citiesSet = new Set();
    const propertyTypesSet = new Set();
    const roomTypesSet = new Set();
    const amenitiesMap = {};
    let minRent = Infinity;
    let maxRent = 0;
    let minTotalCost = Infinity;
    let maxTotalCost = 0;

    properties.forEach((p) => {
      if (p.address?.city) citiesSet.add(p.address.city);
      if (p.propertyType) propertyTypesSet.add(p.propertyType);

      if (p.roomConfigurations) {
        p.roomConfigurations.forEach((rc) => {
          if (rc.type) roomTypesSet.add(rc.type);
        });
      }

      if (p.amenities) {
        p.amenities.forEach((a) => {
          amenitiesMap[a] = (amenitiesMap[a] || 0) + 1;
        });
      }

      const pMinRent = p.rentRange?.min || 0;
      const pMaxRent = p.rentRange?.max || pMinRent;
      if (pMinRent < minRent) minRent = pMinRent;
      if (pMaxRent > maxRent) maxRent = pMaxRent;

      const totalCost = p.totalEstimatedMonthlyCost || pMinRent;
      if (totalCost < minTotalCost) minTotalCost = totalCost;
      if (totalCost > maxTotalCost) maxTotalCost = totalCost;
    });

    const amenitiesList = Object.keys(amenitiesMap)
      .map((name) => ({
        name,
        count: amenitiesMap[name],
      }))
      .sort((a, b) => b.count - a.count);

    return successResponse(
      res,
      'Filter metadata retrieved successfully',
      {
        cities: Array.from(citiesSet).sort(),
        propertyTypes: Array.from(propertyTypesSet),
        roomTypes: Array.from(roomTypesSet),
        amenities: amenitiesList,
        rentRange: {
          min: minRent === Infinity ? 0 : minRent,
          max: maxRent,
        },
        totalCostRange: {
          min: minTotalCost === Infinity ? 0 : minTotalCost,
          max: maxTotalCost,
        },
        genderOptions: ['MALE', 'FEMALE', 'UNISEX'],
        targetOccupantOptions: ['STUDENTS', 'WORKING_PROFESSIONALS', 'ANY'],
        electricityBillingOptions: ['PER_UNIT', 'FIXED', 'INCLUDED'],
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single property by ID with complete breakdown & owner profile
 * @route   GET /api/v1/properties/:id
 * @access  Public
 */
export const getPropertyById = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id).populate(
      'ownerId',
      'name email phone avatar isVerified createdAt'
    );

    if (!property) {
      return errorResponse(res, 'Property not found', 404);
    }

    // Fetch linked owner profile for additional trust badges
    let ownerProfile = null;
    if (property.ownerId) {
      ownerProfile = await OwnerProfile.findOne({ userId: property.ownerId._id });
    }

    return successResponse(
      res,
      'Property details retrieved',
      {
        property,
        ownerProfile,
      },
      200
    );
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return errorResponse(res, 'Invalid property ID format', 400);
    }
    next(error);
  }
};

/**
 * @desc    Get all properties owned by currently logged-in landlord
 * @route   GET /api/v1/properties/my-listings
 * @access  Private (OWNER, ADMIN)
 */
export const getMyProperties = async (req, res, next) => {
  try {
    const properties = await Property.find({ ownerId: req.user._id }).sort({ createdAt: -1 });

    return successResponse(
      res,
      'Owner properties retrieved',
      {
        properties,
        count: properties.length,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new property listing
 * @route   POST /api/v1/properties
 * @access  Private (OWNER, ADMIN)
 */
export const createProperty = async (req, res, next) => {
  try {
    const { isValid, errors } = validatePropertyInput(req.body);
    if (!isValid) {
      return errorResponse(res, 'Validation failed', 400, errors);
    }

    // Landlord creates with PENDING status; ADMIN can create directly as VERIFIED
    const defaultStatus =
      req.user.role === ROLES.ADMIN ? VERIFICATION_STATUS.VERIFIED : VERIFICATION_STATUS.PENDING;

    const propertyData = {
      ...req.body,
      ownerId: req.user._id,
      verificationStatus: req.body.verificationStatus || defaultStatus,
    };

    const property = await Property.create(propertyData);

    // Update landlord's propertiesCount
    await OwnerProfile.findOneAndUpdate(
      { userId: req.user._id },
      { $inc: { propertiesCount: 1 } }
    );

    return successResponse(
      res,
      'Property listing created successfully',
      { property },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing property listing
 * @route   PUT /api/v1/properties/:id
 * @access  Private (OWNER of property, or ADMIN)
 */
export const updateProperty = async (req, res, next) => {
  try {
    let property = await Property.findById(req.params.id);

    if (!property) {
      return errorResponse(res, 'Property not found', 404);
    }

    // Ownership Authorization Check
    const isOwner = property.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === ROLES.ADMIN;

    if (!isOwner && !isAdmin) {
      return errorResponse(res, 'You are not authorized to update this property', 403);
    }

    // If owner updates, keep or reset to pending if major details changed
    const updateData = { ...req.body };
    delete updateData.ownerId; // Do not allow transferring ownership via update

    property = await Property.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    return successResponse(
      res,
      'Property listing updated successfully',
      { property },
      200
    );
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return errorResponse(res, 'Invalid property ID format', 400);
    }
    next(error);
  }
};

/**
 * @desc    Delete a property listing
 * @route   DELETE /api/v1/properties/:id
 * @access  Private (OWNER of property, or ADMIN)
 */
export const deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return errorResponse(res, 'Property not found', 404);
    }

    // Ownership Authorization Check
    const isOwner = property.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === ROLES.ADMIN;

    if (!isOwner && !isAdmin) {
      return errorResponse(res, 'You are not authorized to delete this property', 403);
    }

    await Property.findByIdAndDelete(req.params.id);

    // Decrement landlord properties count
    await OwnerProfile.findOneAndUpdate(
      { userId: property.ownerId },
      { $inc: { propertiesCount: -1 } }
    );

    return successResponse(res, 'Property listing deleted successfully', null, 200);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return errorResponse(res, 'Invalid property ID format', 400);
    }
    next(error);
  }
};

/**
 * @desc    Verify or reject a property listing
 * @route   PATCH /api/v1/properties/:id/verify
 * @access  Private (ADMIN only)
 */
export const verifyProperty = async (req, res, next) => {
  try {
    const { status, notes, trustScore } = req.body;

    if (!Object.values(VERIFICATION_STATUS).includes(status)) {
      return errorResponse(
        res,
        `Invalid status. Allowed values: ${Object.values(VERIFICATION_STATUS).join(', ')}`,
        400
      );
    }

    const updateFields = {
      verificationStatus: status,
      verificationNotes: notes || '',
      verifiedBy: req.user._id,
      verifiedAt: new Date(),
    };

    if (typeof trustScore === 'number' && trustScore >= 0 && trustScore <= 100) {
      updateFields.trustScore = trustScore;
    }

    const property = await Property.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
    });

    if (!property) {
      return errorResponse(res, 'Property not found', 404);
    }

    // Trigger notification to Landlord (Owner)
    await notificationService.notifyUser({
      userId: property.ownerId,
      type: NOTIFICATION_TYPES.PROPERTY_VERIFICATION,
      title: `Property Physical Audit: ${status}`,
      message: `Your property listing '${property.title}' verification status has been updated to ${status}.`,
      relatedEntity: { entityType: 'PROPERTY', entityId: property._id },
      actionUrl: '/dashboard/owner',
      priority: NOTIFICATION_PRIORITY.HIGH,
    });

    return successResponse(
      res,
      `Property verification status updated to ${status}`,
      { property },
      200
    );

  } catch (error) {
    if (error.kind === 'ObjectId') {
      return errorResponse(res, 'Invalid property ID format', 400);
    }
    next(error);
  }
};

/**
 * @desc    Get all properties for Admin moderation queue
 * @route   GET /api/v1/properties/admin/all
 * @access  Private (ADMIN only)
 */
export const getAdminProperties = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status && status.toUpperCase() !== 'ALL') {
      query.verificationStatus = status.toUpperCase();
    }

    if (search) {
      query.title = new RegExp(search.trim(), 'i');
    }

    const properties = await Property.find(query)
      .populate('ownerId', 'name email phone avatar')
      .sort({ createdAt: -1 });

    return successResponse(
      res,
      'Admin properties retrieved',
      {
        properties,
        total: properties.length,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get property-level performance metrics & statistics
 * @route   GET /api/v1/properties/:id/stats
 * @access  Private (Owner of property or Admin)
 */
export const getPropertyStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id);
    if (!property) return errorResponse(res, 'Property not found', 404);

    const isOwner = property.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === ROLES.ADMIN;
    if (!isOwner && !isAdmin) {
      return errorResponse(res, 'Unauthorized to view detailed statistics', 403);
    }

    const totalRooms = property.rooms?.length || property.roomConfigurations?.length || 0;
    const totalBeds = property.totalBeds || 0;
    const availableBeds = property.totalAvailableBeds || 0;
    const occupiedBeds = property.occupiedBeds || 0;
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    const activeResidents = await Booking.countDocuments({
      propertyId: property._id,
      status: { $in: ['CHECKED_IN', 'ACTIVE_STAY'] },
    });

    const invoices = await RentLedger.find({ propertyId: property._id }).lean();
    let monthlyRevenue = 0;
    let pendingRent = 0;
    const currentMonthPrefix = new Date().toISOString().slice(0, 7);
    invoices.forEach((inv) => {
      if (inv.status === 'PAID') {
        if (inv.billingMonth && inv.billingMonth.startsWith(currentMonthPrefix)) {
          monthlyRevenue += inv.amountPaid || 0;
        }
      } else if (['DUE', 'OVERDUE', 'PARTIALLY_PAID'].includes(inv.status)) {
        pendingRent += inv.balanceDue || 0;
      }
    });

    if (monthlyRevenue === 0 && invoices.length > 0) {
      monthlyRevenue = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
    }

    const openTickets = await MaintenanceTicket.countDocuments({
      propertyId: property._id,
      status: { $in: ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS', 'REOPENED'] },
    });

    const roomTypeMap = {};
    if (property.rooms && property.rooms.length > 0) {
      property.rooms.forEach((r) => {
        const type = r.sharingType || r.roomType || 'SINGLE';
        roomTypeMap[type] = (roomTypeMap[type] || 0) + 1;
      });
    }

    return successResponse(res, 'Property statistics retrieved', {
      propertyId: property._id,
      title: property.title,
      totalRooms,
      totalBeds,
      occupiedBeds,
      availableBeds,
      occupancyRate,
      activeResidents,
      monthlyRevenue,
      pendingRent,
      pendingMaintenanceRequests: openTickets,
      averageRating: property.ratings?.overallAverage || 0,
      totalReviews: property.ratings?.totalReviews || 0,
      roomTypeBreakdown: roomTypeMap,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return errorResponse(res, 'Invalid property ID format', 400);
    }
    next(error);
  }
};

/**
 * @desc    Get structured rooms and beds for a property
 * @route   GET /api/v1/properties/:id/rooms
 * @access  Public (or Authenticated)
 */
export const getPropertyRooms = async (req, res, next) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id).populate({
      path: 'rooms.beds.occupiedBy',
      select: 'name email phone avatar',
    });
    if (!property) return errorResponse(res, 'Property not found', 404);

    return successResponse(res, 'Rooms retrieved successfully', {
      rooms: property.rooms || [],
      totalRooms: property.rooms?.length || 0,
      totalBeds: property.totalBeds,
      availableBeds: property.totalAvailableBeds,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return errorResponse(res, 'Invalid property ID format', 400);
    }
    next(error);
  }
};

/**
 * @desc    Add a room to a property
 * @route   POST /api/v1/properties/:id/rooms
 * @access  Private (Owner of property or Admin)
 */
export const addRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const property = await Property.findById(id);
    if (!property) return errorResponse(res, 'Property not found', 404);

    const isOwner = property.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === ROLES.ADMIN;
    if (!isOwner && !isAdmin) return errorResponse(res, 'Unauthorized', 403);

    const {
      roomNumber,
      floor = 1,
      roomType = 'SINGLE',
      sharingType = 'SINGLE',
      rent,
      rentPerBed,
      deposit = 0,
      depositPerBed,
      attachedWashroom = true,
      hasBalcony = false,
      hasAC = false,
      amenities = [],
      bedCount = 1,
      beds = [],
    } = req.body;

    const finalRent = rent !== undefined ? rent : rentPerBed;
    const finalDeposit = deposit !== undefined ? deposit : (depositPerBed !== undefined ? depositPerBed : 0);

    if (!roomNumber || finalRent === undefined || finalRent === null) {
      return errorResponse(res, 'Room number and rent are required', 400);
    }

    const duplicate = property.rooms.some((r) => r.roomNumber.toLowerCase() === String(roomNumber).toLowerCase());
    if (duplicate) {
      return errorResponse(res, `Room ${roomNumber} already exists in this property`, 400);
    }

    let finalBeds = beds;
    if (!finalBeds || finalBeds.length === 0) {
      finalBeds = [];
      const count = Number(bedCount) || 1;
      for (let i = 1; i <= count; i++) {
        finalBeds.push({
          bedNumber: count === 1 ? 'Bed 1' : `Bed ${String.fromCharCode(64 + i)}`,
          status: BED_STATUS.AVAILABLE,
          price: Number(finalRent),
        });
      }
    }

    property.rooms.push({
      roomNumber: String(roomNumber),
      floor: Number(floor) || 1,
      roomType,
      sharingType: sharingType || roomType,
      rent: Number(finalRent),
      deposit: Number(finalDeposit),
      attachedWashroom: !!attachedWashroom,
      hasBalcony: !!hasBalcony,
      hasAC: !!hasAC,
      amenities: Array.isArray(amenities) ? amenities : [],
      beds: finalBeds,
    });

    await property.save();

    return successResponse(res, 'Room added successfully', {
      room: property.rooms[property.rooms.length - 1],
      property,
    }, 201);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return errorResponse(res, 'Invalid property ID format', 400);
    }
    next(error);
  }
};

/**
 * @desc    Update a room in a property
 * @route   PUT /api/v1/properties/:id/rooms/:roomId
 * @access  Private (Owner of property or Admin)
 */
export const updateRoom = async (req, res, next) => {
  try {
    const { id, roomId } = req.params;
    const property = await Property.findById(id);
    if (!property) return errorResponse(res, 'Property not found', 404);

    const isOwner = property.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === ROLES.ADMIN;
    if (!isOwner && !isAdmin) return errorResponse(res, 'Unauthorized', 403);

    const room = property.rooms.id(roomId);
    if (!room) return errorResponse(res, 'Room not found', 404);

    const {
      roomNumber,
      floor,
      roomType,
      sharingType,
      rent,
      rentPerBed,
      deposit,
      depositPerBed,
      attachedWashroom,
      hasBalcony,
      hasAC,
      amenities,
    } = req.body;

    const finalRent = rent !== undefined ? rent : rentPerBed;
    const finalDeposit = deposit !== undefined ? deposit : depositPerBed;

    if (roomNumber !== undefined) room.roomNumber = String(roomNumber);
    if (floor !== undefined) room.floor = Number(floor);
    if (roomType !== undefined) room.roomType = roomType;
    if (sharingType !== undefined) room.sharingType = sharingType;
    if (finalRent !== undefined) room.rent = Number(finalRent);
    if (finalDeposit !== undefined) room.deposit = Number(finalDeposit);
    if (attachedWashroom !== undefined) room.attachedWashroom = !!attachedWashroom;
    if (hasBalcony !== undefined) room.hasBalcony = !!hasBalcony;
    if (hasAC !== undefined) room.hasAC = !!hasAC;
    if (amenities !== undefined) room.amenities = Array.isArray(amenities) ? amenities : [];

    await property.save();

    return successResponse(res, 'Room updated successfully', { room, property });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return errorResponse(res, 'Invalid ID format', 400);
    }
    next(error);
  }
};

/**
 * @desc    Delete a room from a property
 * @route   DELETE /api/v1/properties/:id/rooms/:roomId
 * @access  Private (Owner of property or Admin)
 */
export const deleteRoom = async (req, res, next) => {
  try {
    const { id, roomId } = req.params;
    const property = await Property.findById(id);
    if (!property) return errorResponse(res, 'Property not found', 404);

    const isOwner = property.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === ROLES.ADMIN;
    if (!isOwner && !isAdmin) return errorResponse(res, 'Unauthorized', 403);

    const room = property.rooms.id(roomId);
    if (!room) return errorResponse(res, 'Room not found', 404);

    const hasActiveOccupants = room.beds?.some(
      (b) => b.status === BED_STATUS.OCCUPIED || b.status === BED_STATUS.BOOKED
    );
    if (hasActiveOccupants) {
      return errorResponse(
        res,
        'Cannot delete room with active occupants or bookings. Please reassign or checkout occupants first.',
        400
      );
    }

    property.rooms.pull({ _id: roomId });
    await property.save();

    return successResponse(res, 'Room deleted successfully', { property });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return errorResponse(res, 'Invalid ID format', 400);
    }
    next(error);
  }
};

/**
 * @desc    Update status of a specific bed in a room
 * @route   PATCH /api/v1/properties/:id/rooms/:roomId/beds/:bedId/status or /api/v1/properties/:id/beds/:bedId/status
 * @access  Private (Owner of property or Admin)
 */
export const updateBedStatus = async (req, res, next) => {
  try {
    const { id, roomId, bedId } = req.params;
    const { status, occupiedBy, bookingId, notes } = req.body;

    if (!status || !Object.values(BED_STATUS).includes(status)) {
      return errorResponse(
        res,
        `Invalid bed status. Allowed values: ${Object.values(BED_STATUS).join(', ')}`,
        400
      );
    }

    const property = await Property.findById(id);
    if (!property) return errorResponse(res, 'Property not found', 404);

    const isOwner = property.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === ROLES.ADMIN;
    if (!isOwner && !isAdmin) return errorResponse(res, 'Unauthorized', 403);

    let room;
    let bed;

    if (roomId) {
      room = property.rooms.id(roomId);
      if (room) bed = room.beds.id(bedId);
    } else {
      // Find room that contains bedId
      for (const r of property.rooms) {
        const foundBed = r.beds.id(bedId);
        if (foundBed) {
          room = r;
          bed = foundBed;
          break;
        }
      }
    }

    if (!room || !bed) {
      return errorResponse(res, 'Bed not found in property', 404);
    }

    if (
      status === BED_STATUS.OCCUPIED &&
      bed.status === BED_STATUS.OCCUPIED &&
      occupiedBy &&
      bed.occupiedBy &&
      bed.occupiedBy.toString() !== occupiedBy.toString()
    ) {
      return errorResponse(res, 'Bed is already allocated to another resident', 400);
    }

    bed.status = status;
    if (status === BED_STATUS.AVAILABLE) {
      bed.occupiedBy = null;
      bed.bookingId = null;
    } else {
      if (occupiedBy !== undefined) bed.occupiedBy = occupiedBy || null;
      if (bookingId !== undefined) bed.bookingId = bookingId || null;
    }
    if (notes !== undefined) bed.notes = notes;

    await property.save();

    return successResponse(res, 'Bed status updated successfully', { bed, room, property });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return errorResponse(res, 'Invalid ID format', 400);
    }
    next(error);
  }
};

/**
 * @desc    Add a photo with category to a property
 * @route   POST /api/v1/properties/:id/photos
 * @access  Private (Owner of property or Admin)
 */
export const addPropertyPhoto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { url, category = PHOTO_CATEGORIES.GALLERY, caption = '', isCover = false } = req.body;

    if (!url || typeof url !== 'string' || !url.trim()) {
      return errorResponse(res, 'Photo URL is required', 400);
    }

    const property = await Property.findById(id);
    if (!property) return errorResponse(res, 'Property not found', 404);

    const isOwner = property.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === ROLES.ADMIN;
    if (!isOwner && !isAdmin) return errorResponse(res, 'Unauthorized', 403);

    if (isCover) {
      property.photos.forEach((p) => {
        p.isCover = false;
      });
      property.coverImage = url.trim();
    }

    property.photos.push({
      url: url.trim(),
      category:
        category && Object.values(PHOTO_CATEGORIES).includes(category)
          ? category
          : PHOTO_CATEGORIES.GALLERY,
      caption: caption ? caption.trim() : '',
      isCover: !!isCover,
    });

    if (!property.images.includes(url.trim())) {
      property.images.push(url.trim());
    }

    await property.save();

    return successResponse(
      res,
      'Photo added successfully',
      {
        photos: property.photos,
        coverImage: property.coverImage,
      },
      201
    );
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return errorResponse(res, 'Invalid property ID format', 400);
    }
    next(error);
  }
};

/**
 * @desc    Delete a photo from a property
 * @route   DELETE /api/v1/properties/:id/photos/:photoId
 * @access  Private (Owner of property or Admin)
 */
export const deletePropertyPhoto = async (req, res, next) => {
  try {
    const { id, photoId } = req.params;
    const property = await Property.findById(id);
    if (!property) return errorResponse(res, 'Property not found', 404);

    const isOwner = property.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === ROLES.ADMIN;
    if (!isOwner && !isAdmin) return errorResponse(res, 'Unauthorized', 403);

    const photo = property.photos.id(photoId);
    if (!photo) return errorResponse(res, 'Photo not found', 404);

    const removedUrl = photo.url;
    property.photos.pull({ _id: photoId });
    property.images = property.images.filter((img) => img !== removedUrl);

    if (property.coverImage === removedUrl) {
      property.coverImage = property.photos.length > 0 ? property.photos[0].url : '';
      if (property.photos.length > 0) {
        property.photos[0].isCover = true;
      }
    }

    await property.save();

    return successResponse(res, 'Photo deleted successfully', {
      photos: property.photos,
      coverImage: property.coverImage,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return errorResponse(res, 'Invalid ID format', 400);
    }
    next(error);
  }
};

