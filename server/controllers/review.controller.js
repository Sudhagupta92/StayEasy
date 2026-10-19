import mongoose from 'mongoose';
import { Review, Property, Booking } from '../models/index.js';
import { BOOKING_STATUS, REVIEW_STATUS, ROLES, NOTIFICATION_TYPES, NOTIFICATION_PRIORITY } from '../constants/roles.js';
import { notificationService } from '../services/notificationService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

import {
  validateCreateReviewInput,
  validateOwnerResponseInput,
  validateFlagInput,
} from '../validators/review.validator.js';

/**
 * Helper to compute authoritative stay details & duration from Booking record
 */
const calculateStayDetails = (booking) => {
  const checkIn = booking.checkInDate || booking.moveInDate || booking.createdAt || new Date();
  const isCheckedOut = booking.status === BOOKING_STATUS.CHECKED_OUT && booking.checkOutDate;
  const checkOut = isCheckedOut ? booking.checkOutDate : new Date();

  const diffMs = Math.max(0, new Date(checkOut).getTime() - new Date(checkIn).getTime());
  const stayDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));

  const isCurrent = !isCheckedOut;
  const stayDurationText = isCurrent
    ? `Currently staying · ${stayDays} day${stayDays === 1 ? '' : 's'}`
    : `Stayed for: ${stayDays} day${stayDays === 1 ? '' : 's'}`;

  return {
    checkInDate: checkIn,
    checkOutDate: isCheckedOut ? booking.checkOutDate : null,
    stayDurationDays: stayDays,
    isCurrentResident: isCurrent,
    stayDurationText,
  };
};

/**
 * @desc    Create a new verified resident review
 * @route   POST /api/v1/reviews
 * @access  Private (USER/Tenant)
 */
export const createReview = async (req, res, next) => {
  try {
    const { isValid, errors } = validateCreateReviewInput(req.body);
    if (!isValid) {
      return errorResponse(res, 'Validation failed', 400, errors);
    }

    const {
      propertyId,
      title,
      comment,
      overallRating,
      foodQualityRating,
      cleanlinessRating,
      ownerResponsivenessRating,
      billingTransparencyRating,
      amenitiesRating,
      promiseVsRealityScore,
      pros,
      cons,
    } = req.body;

    // Check if property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return errorResponse(res, 'Property not found', 404);
    }

    // Check if owner is trying to review their own property
    if (property.ownerId.toString() === req.user._id.toString()) {
      return errorResponse(res, 'Owners cannot review their own property', 403);
    }

    // Verified Resident Check: tenant must have an authoritative stay at this property
    const eligibleBooking = await Booking.findOne({
      propertyId,
      tenantId: req.user._id,
      $or: [
        { status: { $in: [BOOKING_STATUS.CHECKED_IN, BOOKING_STATUS.ACTIVE_STAY, BOOKING_STATUS.CHECKED_OUT] } },
        { isVerifiedResident: true },
        { checkInDate: { $ne: null } },
      ],
    }).sort({ createdAt: -1 });

    if (!eligibleBooking) {
      return errorResponse(
        res,
        'Only verified residents who have stayed at this property can submit a review.',
        403
      );
    }

    // Check if tenant has already submitted a review for this booking or property (prevent multiple fake reviews)
    const existingReview = await Review.findOne({
      $or: [
        { bookingId: eligibleBooking._id },
        { propertyId, tenantId: req.user._id },
      ],
    });

    if (existingReview) {
      return errorResponse(res, 'You have already submitted a review for this verified stay / property', 400);
    }

    // Parse pros and cons if provided as comma-separated strings or arrays
    const formattedPros = Array.isArray(pros)
      ? pros
      : typeof pros === 'string' && pros.trim()
      ? pros.split(',').map((p) => p.trim())
      : [];

    const formattedCons = Array.isArray(cons)
      ? cons
      : typeof cons === 'string' && cons.trim()
      ? cons.split(',').map((c) => c.trim())
      : [];

    // Calculate stay duration & dates authoritatively on server
    const stayDetails = calculateStayDetails(eligibleBooking);

    // Create review with authoritative backend-calculated verification and stay duration
    const review = await Review.create({
      propertyId,
      tenantId: req.user._id,
      bookingId: eligibleBooking._id,
      ownerId: property.ownerId,
      title: title.trim(),
      comment: comment.trim(),
      overallRating,
      foodQualityRating: foodQualityRating || overallRating,
      cleanlinessRating: cleanlinessRating || overallRating,
      ownerResponsivenessRating: ownerResponsivenessRating || overallRating,
      billingTransparencyRating: billingTransparencyRating || overallRating,
      amenitiesRating: amenitiesRating || overallRating,
      promiseVsRealityScore: promiseVsRealityScore || 8,
      pros: formattedPros,
      cons: formattedCons,
      roomTypeStayed: eligibleBooking.roomType || 'SINGLE',
      roomName: eligibleBooking.roomName || '',
      isVerifiedResident: true,
      stayDurationDays: stayDetails.stayDurationDays,
      isCurrentResident: stayDetails.isCurrentResident,
      checkInDate: stayDetails.checkInDate,
      checkOutDate: stayDetails.checkOutDate,
      stayDurationText: stayDetails.stayDurationText,
      status: REVIEW_STATUS.APPROVED,
    });

    // Recalculate property aggregated ratings
    await Property.recalculateRatings(propertyId);

    const populatedReview = await Review.findById(review._id).populate(
      'tenantId',
      'name avatar role'
    );

    // Trigger notification to Landlord (Owner)
    await notificationService.notifyUser({
      userId: property.ownerId,
      type: NOTIFICATION_TYPES.REVIEW_SUBMITTED,
      title: 'New Verified Resident Review Published',
      message: `${req.user.name || 'A verified resident'} submitted a ${overallRating}-star review for ${property.title}.`,
      relatedEntity: { entityType: 'REVIEW', entityId: review._id },
      actionUrl: `/properties/${propertyId}`,
      priority: NOTIFICATION_PRIORITY.MEDIUM,
    });

    return successResponse(
      res,
      'Review submitted successfully as a Verified Resident!',
      { review: populatedReview },
      201
    );

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Check if logged-in user is eligible to review a property
 * @route   GET /api/v1/reviews/eligibility/:propertyId
 * @access  Private (Authenticated)
 */
export const getReviewEligibility = async (req, res, next) => {
  try {
    const { propertyId } = req.params;

    const property = await Property.findById(propertyId);
    if (!property) {
      return errorResponse(res, 'Property not found', 404);
    }

    if (property.ownerId.toString() === req.user._id.toString()) {
      return successResponse(res, 'Eligibility check completed', {
        isEligible: false,
        reason: 'Property owners cannot review their own property',
      });
    }

    const eligibleBooking = await Booking.findOne({
      propertyId,
      tenantId: req.user._id,
      $or: [
        { status: { $in: [BOOKING_STATUS.CHECKED_IN, BOOKING_STATUS.ACTIVE_STAY, BOOKING_STATUS.CHECKED_OUT] } },
        { isVerifiedResident: true },
        { checkInDate: { $ne: null } },
      ],
    }).sort({ createdAt: -1 });

    if (!eligibleBooking) {
      return successResponse(res, 'Eligibility check completed', {
        isEligible: false,
        reason: 'No verified stay found at this property. Only verified residents who have stayed here can submit reviews.',
      });
    }

    const existingReview = await Review.findOne({
      $or: [{ bookingId: eligibleBooking._id }, { propertyId, tenantId: req.user._id }],
    });

    if (existingReview) {
      return successResponse(res, 'Eligibility check completed', {
        isEligible: false,
        alreadyReviewed: true,
        reviewId: existingReview._id,
        reason: 'You have already submitted a review for this verified stay.',
      });
    }

    const stayDetails = calculateStayDetails(eligibleBooking);

    return successResponse(res, 'Eligibility check completed', {
      isEligible: true,
      isVerifiedResident: true,
      bookingId: eligibleBooking._id,
      roomType: eligibleBooking.roomType,
      roomName: eligibleBooking.roomName,
      checkInDate: stayDetails.checkInDate,
      checkOutDate: stayDetails.checkOutDate,
      stayDurationDays: stayDetails.stayDurationDays,
      isCurrentResident: stayDetails.isCurrentResident,
      stayDurationText: stayDetails.stayDurationText,
      message: 'Verified resident status confirmed. You are eligible to review this property!',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all approved reviews for a property
 * @route   GET /api/v1/reviews/property/:propertyId
 * @access  Public
 */
export const getPropertyReviews = async (req, res, next) => {
  try {
    const { propertyId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const sortBy = req.query.sortBy || 'recent'; // recent, rating_high, rating_low, helpful
    const skip = (page - 1) * limit;

    const property = await Property.findById(propertyId);
    if (!property) {
      return errorResponse(res, 'Property not found', 404);
    }

    let sortOptions = { createdAt: -1 };
    if (sortBy === 'rating_high') sortOptions = { overallRating: -1, createdAt: -1 };
    if (sortBy === 'rating_low') sortOptions = { overallRating: 1, createdAt: -1 };

    const filter = { propertyId, status: REVIEW_STATUS.APPROVED };

    let reviewsQuery = Review.find(filter)
      .populate('tenantId', 'name avatar role')
      .populate('ownerId', 'name');

    if (sortBy === 'recent' || sortBy === 'rating_high' || sortBy === 'rating_low') {
      reviewsQuery = reviewsQuery.sort(sortOptions);
    }

    let reviews = await reviewsQuery.skip(skip).limit(limit);

    // If sorting by helpful, sort in memory by helpfulVotes length
    if (sortBy === 'helpful') {
      reviews.sort((a, b) => (b.helpfulVotes?.length || 0) - (a.helpfulVotes?.length || 0));
    }

    const totalCount = await Review.countDocuments(filter);

    return successResponse(res, 'Property reviews retrieved successfully', {
      reviews,
      ratingsSummary: property.ratings || {},
      trustScore: property.trustScore,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle helpful or unhelpful vote on a review
 * @route   POST /api/v1/reviews/:id/helpful
 * @access  Private (Authenticated)
 */
export const toggleHelpfulVote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'helpful' or 'unhelpful'

    const review = await Review.findById(id);
    if (!review) {
      return errorResponse(res, 'Review not found', 404);
    }

    const userId = req.user._id;
    const hasHelpful = review.helpfulVotes.some((v) => v.toString() === userId.toString());
    const hasUnhelpful = review.unhelpfulVotes.some((v) => v.toString() === userId.toString());

    if (type === 'unhelpful') {
      if (hasUnhelpful) {
        review.unhelpfulVotes = review.unhelpfulVotes.filter((v) => v.toString() !== userId.toString());
      } else {
        review.unhelpfulVotes.push(userId);
        if (hasHelpful) {
          review.helpfulVotes = review.helpfulVotes.filter((v) => v.toString() !== userId.toString());
        }
      }
    } else {
      // Default: helpful
      if (hasHelpful) {
        review.helpfulVotes = review.helpfulVotes.filter((v) => v.toString() !== userId.toString());
      } else {
        review.helpfulVotes.push(userId);
        if (hasUnhelpful) {
          review.unhelpfulVotes = review.unhelpfulVotes.filter((v) => v.toString() !== userId.toString());
        }
      }
    }

    await review.save();

    return successResponse(res, 'Feedback recorded', {
      helpfulCount: review.helpfulVotes.length,
      unhelpfulCount: review.unhelpfulVotes.length,
      userHasHelpful: review.helpfulVotes.some((v) => v.toString() === userId.toString()),
      userHasUnhelpful: review.unhelpfulVotes.some((v) => v.toString() === userId.toString()),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Owner responds to a review on their property
 * @route   POST /api/v1/reviews/:id/respond
 * @access  Private (OWNER)
 */
export const ownerRespondToReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isValid, errors } = validateOwnerResponseInput(req.body);
    if (!isValid) {
      return errorResponse(res, 'Validation failed', 400, errors);
    }

    const review = await Review.findById(id);
    if (!review) {
      return errorResponse(res, 'Review not found', 404);
    }

    if (review.ownerId.toString() !== req.user._id.toString() && req.user.role !== ROLES.ADMIN) {
      return errorResponse(res, 'You are not authorized to respond to this review', 403);
    }

    review.ownerResponse = {
      responseText: req.body.responseText.trim(),
      respondedAt: new Date(),
    };

    await review.save();

    // Trigger notification to Reviewer (Tenant)
    await notificationService.notifyUser({
      userId: review.tenantId,
      type: NOTIFICATION_TYPES.REVIEW_RESPONSE,
      title: 'Landlord Responded to Your Review',
      message: `The landlord published an official response to your resident review.`,
      relatedEntity: { entityType: 'REVIEW', entityId: review._id },
      actionUrl: `/properties/${review.propertyId}`,
      priority: NOTIFICATION_PRIORITY.MEDIUM,
    });

    const updatedReview = await Review.findById(id)
      .populate('tenantId', 'name avatar role')
      .populate('ownerId', 'name');

    return successResponse(res, 'Owner response attached successfully', { review: updatedReview });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Report / flag an abusive or inaccurate review
 * @route   POST /api/v1/reviews/:id/flag
 * @access  Private (Authenticated)
 */
export const flagReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isValid, errors } = validateFlagInput(req.body);
    if (!isValid) {
      return errorResponse(res, 'Validation failed', 400, errors);
    }

    const review = await Review.findById(id);
    if (!review) {
      return errorResponse(res, 'Review not found', 404);
    }

    const userId = req.user._id;
    const alreadyFlagged = review.flags.some((f) => f.userId.toString() === userId.toString());

    if (alreadyFlagged) {
      return errorResponse(res, 'You have already reported this review', 400);
    }

    review.flags.push({
      userId,
      reason: req.body.reason.trim(),
      createdAt: new Date(),
    });

    if (review.flags.length >= 2 && review.status === REVIEW_STATUS.APPROVED) {
      review.status = REVIEW_STATUS.FLAGGED;
    }

    await review.save();

    return successResponse(res, 'Review reported for moderation', {
      flagCount: review.flags.length,
      status: review.status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all reviews posted by logged-in tenant
 * @route   GET /api/v1/reviews/my-reviews
 * @access  Private (USER/Tenant)
 */
export const getMyTenantReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ tenantId: req.user._id })
      .populate('propertyId', 'title images address city propertyType')
      .sort({ createdAt: -1 });

    return successResponse(res, 'Tenant reviews retrieved successfully', { reviews });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all reviews received for properties owned by logged-in landlord
 * @route   GET /api/v1/reviews/owner-reviews
 * @access  Private (OWNER)
 */
export const getOwnerPropertyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ ownerId: req.user._id })
      .populate('propertyId', 'title images address city')
      .populate('tenantId', 'name avatar role')
      .sort({ createdAt: -1 });

    return successResponse(res, 'Landlord property reviews retrieved successfully', { reviews });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin view all flagged or pending reviews
 * @route   GET /api/v1/reviews/admin/flagged
 * @access  Private (ADMIN)
 */
export const getAdminFlaggedReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({
      $or: [
        { 'flags.0': { $exists: true } },
        { status: { $in: [REVIEW_STATUS.FLAGGED, REVIEW_STATUS.PENDING, REVIEW_STATUS.REJECTED] } },
      ],
    })
      .populate('propertyId', 'title city')
      .populate('tenantId', 'name email')
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 });

    return successResponse(res, 'Flagged reviews retrieved for admin moderation', { reviews });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Admin moderate review status (Approve, Reject, or Delete)
 * @route   PATCH /api/v1/reviews/:id/moderate
 * @access  Private (ADMIN)
 */
export const moderateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status || !Object.values(REVIEW_STATUS).includes(status)) {
      return errorResponse(res, 'Valid review status is required', 400);
    }

    const review = await Review.findById(id);
    if (!review) {
      return errorResponse(res, 'Review not found', 404);
    }

    review.status = status;
    review.isModerated = true;
    review.moderatedBy = req.user._id;
    review.moderatedAt = new Date();

    await review.save();

    // Trigger notification to Tenant
    await notificationService.notifyUser({
      userId: review.tenantId,
      type: NOTIFICATION_TYPES.REVIEW_MODERATED,
      title: `Review Moderation Decision: ${status}`,
      message: `Platform admin moderated your review status to ${status}.`,
      relatedEntity: { entityType: 'REVIEW', entityId: review._id },
      actionUrl: `/properties/${review.propertyId}`,
      priority: NOTIFICATION_PRIORITY.LOW,
    });

    // Recalculate property ratings after status change
    await Property.recalculateRatings(review.propertyId);


    const updatedReview = await Review.findById(id)
      .populate('propertyId', 'title city ratings')
      .populate('tenantId', 'name email');

    return successResponse(res, `Review status updated to ${status}`, { review: updatedReview });
  } catch (error) {
    next(error);
  }
};
