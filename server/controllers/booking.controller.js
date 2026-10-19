import { Booking } from '../models/Booking.js';
import { Property } from '../models/Property.js';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { validateBookingInput } from '../validators/booking.validator.js';
import {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  ESCROW_STATUS,
  ROLES,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITY,
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  PAYMENT_METHODS,
} from '../constants/roles.js';
import { notificationService } from '../services/notificationService.js';


/**
 * @desc    Create a new booking / seat reservation
 * @route   POST /api/v1/bookings
 * @access  Private (USER / Tenant)
 */
export const createBooking = async (req, res, next) => {
  try {
    const { isValid, errors } = validateBookingInput(req.body);
    if (!isValid) {
      return errorResponse(res, 'Validation failed', 400, errors);
    }

    const { propertyId, roomConfigId, moveInDate, durationMonths = 1, notes } = req.body;

    // 1. Find property
    const property = await Property.findById(propertyId);
    if (!property) {
      return errorResponse(res, 'Property not found', 404);
    }

    // 2. Find matching room configuration
    const roomConfig = property.roomConfigurations.id(roomConfigId);
    if (!roomConfig) {
      return errorResponse(res, 'Selected room configuration not found on this property', 404);
    }

    if (roomConfig.availableBeds <= 0) {
      return errorResponse(
        res,
        'No available beds or seats remaining in this room configuration',
        400
      );
    }

    // 3. Atomically decrement available beds using $elemMatch to prevent race conditions
    const updatedProperty = await Property.findOneAndUpdate(
      {
        _id: propertyId,
        roomConfigurations: {
          $elemMatch: {
            _id: roomConfigId,
            availableBeds: { $gt: 0 },
          },
        },
      },
      {
        $inc: { 'roomConfigurations.$.availableBeds': -1 },
      },
      { new: true }
    );

    if (!updatedProperty) {
      return errorResponse(
        res,
        'No available beds or seats remaining in this room configuration',
        400
      );
    }

    // 4. Calculate transparent costs
    const monthlyRent = roomConfig.rent;
    const securityDeposit = roomConfig.deposit;
    const foodCharges =
      property.expenses?.food?.available && !property.expenses?.food?.includedInRent
        ? property.expenses.food.extraCost || 0
        : 0;
    const electricityEstimate =
      property.expenses?.electricity?.type === 'PER_UNIT'
        ? (property.expenses.electricity.rate || 8) * 60
        : property.expenses?.electricity?.rate || 0;
    const maintenanceCharges =
      property.expenses?.maintenance?.type === 'EXTRA'
        ? property.expenses.maintenance.amount || 0
        : 0;

    const totalUpfrontAmount = monthlyRent + securityDeposit;

    // 5. Create booking record
    const booking = await Booking.create({
      tenantId: req.user._id,
      ownerId: property.ownerId,
      propertyId: property._id,
      roomConfigId: roomConfig._id,
      roomType: roomConfig.type,
      roomName: roomConfig.name,
      moveInDate: new Date(moveInDate),
      durationMonths,
      costs: {
        monthlyRent,
        securityDeposit,
        foodCharges,
        electricityEstimate,
        maintenanceCharges,
        totalUpfrontAmount,
      },
      paymentMethod: req.body.paymentMethod && req.body.paymentMethod in PAYMENT_METHODS ? req.body.paymentMethod : PAYMENT_METHODS.UPI,
      status: BOOKING_STATUS.REQUESTED,
      ownerNotes: notes || '',
    });

    // Trigger notification to Landlord (Owner)
    await notificationService.notifyUser({
      userId: property.ownerId,
      type: NOTIFICATION_TYPES.BOOKING_REQUESTED,
      title: 'New Booking Inquiry',
      message: `${req.user.name || 'A tenant'} requested a bed reservation for ${property.title}.`,
      relatedEntity: { entityType: 'BOOKING', entityId: booking._id },
      actionUrl: '/dashboard/owner',
      priority: NOTIFICATION_PRIORITY.HIGH,
    });

    return successResponse(
      res,
      'Seat reservation requested successfully. Landlord will review your booking.',
      { booking },
      201
    );

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all bookings for authenticated tenant
 * @route   GET /api/v1/bookings/my-bookings
 * @access  Private (USER)
 */
export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ tenantId: req.user._id })
      .populate('propertyId', 'title images address propertyType trustScore depositRefundPolicy')
      .populate('ownerId', 'name email phone avatar')
      .sort({ createdAt: -1 });

    return successResponse(
      res,
      'My bookings retrieved successfully',
      { bookings, count: bookings.length },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single booking details
 * @route   GET /api/v1/bookings/:id
 * @access  Private (Tenant, Owner, or Admin)
 */
export const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('propertyId')
      .populate('tenantId', 'name email phone occupation avatar isVerified')
      .populate('ownerId', 'name email phone avatar');

    if (!booking) {
      return errorResponse(res, 'Booking not found', 404);
    }

    // Authorization check
    const isTenant = booking.tenantId._id.equals(req.user._id);
    const isOwner = booking.ownerId._id.equals(req.user._id);
    const isAdmin = req.user.role === ROLES.ADMIN;

    if (!isTenant && !isOwner && !isAdmin) {
      return errorResponse(res, 'You are not authorized to view this booking', 403);
    }

    return successResponse(res, 'Booking details retrieved', { booking }, 200);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return errorResponse(res, 'Invalid booking ID format', 400);
    }
    next(error);
  }
};

/**
 * @desc    Cancel a booking (Tenant action) & restore seat inventory
 * @route   POST /api/v1/bookings/:id/cancel
 * @access  Private (Tenant or Admin)
 */
export const cancelBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return errorResponse(res, 'Booking not found', 404);
    }

    // Ownership check
    const isTenant = booking.tenantId.equals(req.user._id);
    const isAdmin = req.user.role === ROLES.ADMIN;

    if (!isTenant && !isAdmin) {
      return errorResponse(res, 'You are not authorized to cancel this booking', 403);
    }

    // Status check
    const cancellableStatuses = [
      BOOKING_STATUS.REQUESTED,
      BOOKING_STATUS.ACCEPTED,
      BOOKING_STATUS.CONFIRMED,
    ];

    if (!cancellableStatuses.includes(booking.status)) {
      return errorResponse(
        res,
        `Cannot cancel booking with current status: ${booking.status}. Check-in has already occurred.`,
        400
      );
    }

    // 1. Update booking status to CANCELLED
    booking.status = BOOKING_STATUS.CANCELLED;
    booking.cancellationReason = reason || 'Cancelled by tenant';
    booking.cancelledBy = req.user._id;
    booking.cancelledAt = new Date();
    await booking.save();

    // 2. Atomically restore bed inventory on property
    await Property.findOneAndUpdate(
      {
        _id: booking.propertyId,
        'roomConfigurations._id': booking.roomConfigId,
      },
      {
        $inc: { 'roomConfigurations.$.availableBeds': 1 },
      }
    );

    return successResponse(
      res,
      'Booking cancelled successfully and seat inventory restored',
      { booking },
      200
    );
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return errorResponse(res, 'Invalid booking ID format', 400);
    }
    next(error);
  }
};

/**
 * @desc    Get incoming bookings for Landlord
 * @route   GET /api/v1/bookings/owner-bookings
 * @access  Private (OWNER / ADMIN)
 */
export const getOwnerBookings = async (req, res, next) => {
  try {
    const query = req.user.role === ROLES.ADMIN ? {} : { ownerId: req.user._id };

    const bookings = await Booking.find(query)
      .populate('tenantId', 'name email phone occupation avatar isVerified')
      .populate('propertyId', 'title address propertyType')
      .sort({ createdAt: -1 });

    return successResponse(
      res,
      'Owner bookings retrieved successfully',
      { bookings, count: bookings.length },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update stay lifecycle status (Owner action: Accept, Reject, Check-in, Active Stay, Check-out)
 * @route   PATCH /api/v1/bookings/:id/status
 * @access  Private (OWNER / ADMIN)
 */
export const updateBookingStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;

    if (!Object.values(BOOKING_STATUS).includes(status)) {
      return errorResponse(
        res,
        `Invalid status. Allowed values: ${Object.values(BOOKING_STATUS).join(', ')}`,
        400
      );
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return errorResponse(res, 'Booking not found', 404);
    }

    // Ownership check
    const isOwner = booking.ownerId.equals(req.user._id);
    const isAdmin = req.user.role === ROLES.ADMIN;

    if (!isOwner && !isAdmin) {
      return errorResponse(res, 'You are not authorized to manage this booking', 403);
    }

    const previousStatus = booking.status;

    // Handle transitions
    booking.status = status;
    if (notes) booking.ownerNotes = notes;

    // If Landlord rejects, restore bed inventory
    if (status === BOOKING_STATUS.REJECTED && previousStatus !== BOOKING_STATUS.REJECTED) {
      await Property.findOneAndUpdate(
        {
          _id: booking.propertyId,
          'roomConfigurations._id': booking.roomConfigId,
        },
        {
          $inc: { 'roomConfigurations.$.availableBeds': 1 },
        }
      );
    }

    // If Check-in or Active Stay, mark verified resident & set check-in date
    if (status === BOOKING_STATUS.CHECKED_IN || status === BOOKING_STATUS.ACTIVE_STAY) {
      booking.checkInDate = req.body.checkInDate
        ? new Date(req.body.checkInDate)
        : booking.checkInDate || new Date();
      booking.isVerifiedResident = true;
    }

    // If Checked-Out, record checkout date and restore bed inventory for future bookings
    if (status === BOOKING_STATUS.CHECKED_OUT) {
      booking.checkOutDate = req.body.checkOutDate
        ? new Date(req.body.checkOutDate)
        : booking.checkOutDate || new Date();
      booking.isVerifiedResident = true; // Remains verified resident of this historical stay

      if (previousStatus !== BOOKING_STATUS.CHECKED_OUT) {
        await Property.findOneAndUpdate(
          {
            _id: booking.propertyId,
            'roomConfigurations._id': booking.roomConfigId,
          },
          {
            $inc: { 'roomConfigurations.$.availableBeds': 1 },
          }
        );
      }
    }

    await booking.save();

    // Dispatch status change notification to tenant
    let notifType = NOTIFICATION_TYPES.BOOKING_ACCEPTED;
    let notifTitle = 'Booking Status Updated';
    let notifMsg = `Your booking status was updated to ${status}.`;

    if (status === BOOKING_STATUS.ACCEPTED) {
      notifType = NOTIFICATION_TYPES.BOOKING_ACCEPTED;
      notifTitle = 'Booking Request Accepted!';
      notifMsg = 'The landlord has accepted your bed reservation request.';
    } else if (status === BOOKING_STATUS.REJECTED) {
      notifType = NOTIFICATION_TYPES.BOOKING_REJECTED;
      notifTitle = 'Booking Request Declined';
      notifMsg = 'The landlord declined your reservation request. Reserved seat restored.';
    } else if (status === BOOKING_STATUS.CHECKED_IN || status === BOOKING_STATUS.ACTIVE_STAY) {
      notifType = NOTIFICATION_TYPES.CHECKIN_CONFIRMED;
      notifTitle = 'Check-In Confirmed!';
      notifMsg = 'Your physical check-in is verified! Verified Resident status activated.';
    }

    await notificationService.notifyUser({
      userId: booking.tenantId,
      type: notifType,
      title: notifTitle,
      message: notifMsg,
      relatedEntity: { entityType: 'BOOKING', entityId: booking._id },
      actionUrl: '/dashboard/user',
      priority: NOTIFICATION_PRIORITY.HIGH,
    });

    return successResponse(
      res,
      `Booking status updated to ${status}`,
      { booking },
      200
    );

  } catch (error) {
    if (error.kind === 'ObjectId') {
      return errorResponse(res, 'Invalid booking ID format', 400);
    }
    next(error);
  }
};

/**
 * @desc    Get active residents list for Landlord occupancy management
 * @route   GET /api/v1/bookings/owner-residents
 * @access  Private (OWNER / ADMIN)
 */
export const getOwnerResidents = async (req, res, next) => {
  try {
    const { propertyId, status, search, verificationStatus } = req.query;

    const query = {
      ...(req.user.role !== ROLES.ADMIN && { ownerId: req.user._id }),
    };

    // Property filter
    if (propertyId) {
      query.propertyId = propertyId;
    }

    // Status filter
    if (status === 'ACTIVE') {
      query.status = { $in: [BOOKING_STATUS.CHECKED_IN, BOOKING_STATUS.ACTIVE_STAY] };
    } else if (status === 'UPCOMING') {
      query.status = { $in: [BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.CONFIRMED] };
    } else if (status === 'PAST' || status === 'CHECKED_OUT') {
      query.status = BOOKING_STATUS.CHECKED_OUT;
    } else if (status === 'ALL') {
      query.status = {
        $in: [
          BOOKING_STATUS.CHECKED_IN,
          BOOKING_STATUS.ACTIVE_STAY,
          BOOKING_STATUS.ACCEPTED,
          BOOKING_STATUS.CONFIRMED,
          BOOKING_STATUS.CHECKED_OUT,
        ],
      };
    } else {
      // Default: include current active, upcoming, and checked-out residents
      query.status = {
        $in: [
          BOOKING_STATUS.CHECKED_IN,
          BOOKING_STATUS.ACTIVE_STAY,
          BOOKING_STATUS.ACCEPTED,
          BOOKING_STATUS.CONFIRMED,
          BOOKING_STATUS.CHECKED_OUT,
        ],
      };
    }

    // Verification status filter
    if (verificationStatus === 'VERIFIED') {
      query.isVerifiedResident = true;
    } else if (verificationStatus === 'PENDING') {
      query.isVerifiedResident = false;
    }

    let residents = await Booking.find(query)
      .populate('tenantId', 'name email phone occupation avatar isVerified')
      .populate('propertyId', 'title address images')
      .sort({ moveInDate: -1, createdAt: -1 });

    // Client/Server search filter across tenant name, email, phone, and roomName
    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      residents = residents.filter((r) => {
        const tenantName = r.tenantId?.name?.toLowerCase() || '';
        const tenantEmail = r.tenantId?.email?.toLowerCase() || '';
        const tenantPhone = r.tenantId?.phone?.toLowerCase() || '';
        const roomName = r.roomName?.toLowerCase() || '';
        const propTitle = r.propertyId?.title?.toLowerCase() || '';
        return (
          tenantName.includes(s) ||
          tenantEmail.includes(s) ||
          tenantPhone.includes(s) ||
          roomName.includes(s) ||
          propTitle.includes(s)
        );
      });
    }

    // Map each resident with computed stayDuration and formatted stay information
    const enrichedResidents = residents.map((r) => {
      const doc = r.toObject ? r.toObject() : { ...r };
      const checkIn = doc.checkInDate || doc.moveInDate || doc.createdAt;
      const isCheckedOut = doc.status === BOOKING_STATUS.CHECKED_OUT && doc.checkOutDate;
      const checkOut = isCheckedOut ? doc.checkOutDate : new Date();

      const diffMs = Math.max(0, new Date(checkOut).getTime() - new Date(checkIn).getTime());
      const stayDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));

      doc.stayDurationDays = stayDays;
      doc.stayDurationText = isCheckedOut
        ? `Stayed for: ${stayDays} day${stayDays === 1 ? '' : 's'}`
        : `Currently staying · ${stayDays} day${stayDays === 1 ? '' : 's'}`;
      doc.isCurrentResident = !isCheckedOut;

      return doc;
    });

    return successResponse(
      res,
      'Residents retrieved successfully',
      { residents: enrichedResidents, totalResidents: enrichedResidents.length },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Simulate payment of upfront rent + security deposit into Escrow Protection
 * @route   POST /api/v1/bookings/:id/escrow/pay
 * @access  Private (Tenant or Admin)
 */
export const payEscrowDeposit = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return errorResponse(res, 'Booking not found', 404);
    }

    // Ownership check: tenant or admin
    const isTenant = booking.tenantId.equals(req.user._id);
    const isAdmin = req.user.role === ROLES.ADMIN;
    if (!isTenant && !isAdmin) {
      return errorResponse(res, 'You are not authorized to pay for this booking', 403);
    }

    // Status checks
    const { paymentMethod = PAYMENT_METHODS.UPI, idempotencyKey, simulateFailure } = req.body || {};

    // 1. Idempotency Check: prevent duplicate transactions
    if (idempotencyKey) {
      const existingTxn = await Transaction.findOne({ idempotencyKey });
      if (existingTxn && existingTxn.status === TRANSACTION_STATUS.SUCCESS) {
        return successResponse(
          res,
          'Payment already processed with this transaction idempotency key',
          {
            booking,
            transaction: existingTxn,
            idempotentReplay: true,
            receiptId: booking.escrowReceiptId || existingTxn.receiptNumber,
            transactionId: existingTxn._id,
            escrowReceipt: {
              receiptId: booking.escrowReceiptId || existingTxn.receiptNumber,
              bookingReference: booking.bookingReference,
              amountHeld: booking.costs.totalUpfrontAmount,
              securityDeposit: booking.costs.securityDeposit,
              monthlyRent: booking.costs.monthlyRent,
              paidAt: booking.escrowPaidAt || existingTxn.paidAt,
              escrowStatus: booking.escrowStatus,
              paymentMethod: booking.paymentMethod || existingTxn.paymentMethod,
              transactionId: existingTxn._id,
              transactionReference: existingTxn.transactionReference,
            },
          },
          200
        );
      }
    }

    // 2. Status checks (double payment prevention if not an idempotent replay)
    if (booking.status === BOOKING_STATUS.CANCELLED || booking.status === BOOKING_STATUS.REJECTED) {
      return errorResponse(res, `Cannot process payment for a ${booking.status} booking`, 400);
    }

    if (booking.escrowStatus !== ESCROW_STATUS.PENDING_PAYMENT) {
      return errorResponse(res, 'Escrow payment has already been completed for this booking', 400);
    }

    // 3. Failure Simulation Edge Case: keeps booking in PENDING state without duplicate creation
    if (simulateFailure) {
      const failedTxn = await Transaction.create({
        transactionReference: `SE-TXN-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        idempotencyKey: idempotencyKey || `IDEM-FAIL-${Date.now()}`,
        userId: req.user._id,
        ownerId: booking.ownerId,
        tenantId: booking.tenantId,
        propertyId: booking.propertyId,
        bookingId: booking._id,
        type: TRANSACTION_TYPES.DEPOSIT,
        category: 'DEBIT',
        amount: booking.costs.totalUpfrontAmount,
        feeAmount: 0,
        netAmount: booking.costs.totalUpfrontAmount,
        currency: 'INR',
        paymentMethod: paymentMethod in PAYMENT_METHODS ? paymentMethod : PAYMENT_METHODS.UPI,
        status: TRANSACTION_STATUS.FAILED,
        failureReason: 'Payment authorization declined by issuing bank',
        metadata: { reason: 'Payment authorization declined by issuing bank' },
      });

      return errorResponse(
        res,
        'Payment authorization declined by issuing bank. Please retry or choose another payment method.',
        402,
        {
          transactionId: failedTxn._id,
          bookingId: booking._id,
          status: 'FAILED',
          paymentMethod,
        }
      );
    }

    // 4. Handle Pay at Property (OFFLINE_CASH)
    if (paymentMethod === PAYMENT_METHODS.OFFLINE_CASH || paymentMethod === 'PAY_AT_PROPERTY') {
      const property = await Property.findById(booking.propertyId);
      if (!property?.allowPayAtProperty) {
        return errorResponse(
          res,
          'Pay at Property is not allowed for this listing. Host requires advance online escrow protection.',
          400
        );
      }

      booking.paymentMethod = PAYMENT_METHODS.OFFLINE_CASH;
      booking.paymentStatus = PAYMENT_STATUS.PENDING;
      booking.escrowStatus = ESCROW_STATUS.PENDING_PAYMENT;
      if (!booking.escrowReceiptId) {
        const receiptHex = Math.random().toString(36).substring(2, 8).toUpperCase();
        booking.escrowReceiptId = `OFFLINE-BK-${receiptHex}`;
      }
      if (booking.status === BOOKING_STATUS.REQUESTED) {
        booking.status = BOOKING_STATUS.ACCEPTED;
      }

      const offlineTxn = await Transaction.create({
        transactionReference: `SE-TXN-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        idempotencyKey: idempotencyKey || `IDEM-OFFLINE-${booking._id}`,
        userId: req.user._id,
        ownerId: booking.ownerId,
        tenantId: booking.tenantId,
        propertyId: booking.propertyId,
        bookingId: booking._id,
        type: TRANSACTION_TYPES.DEPOSIT,
        category: 'DEBIT',
        amount: booking.costs.totalUpfrontAmount,
        feeAmount: 0,
        netAmount: booking.costs.totalUpfrontAmount,
        currency: 'INR',
        paymentMethod: PAYMENT_METHODS.OFFLINE_CASH,
        status: TRANSACTION_STATUS.CREATED,
        receiptNumber: booking.escrowReceiptId,
        metadata: { mode: 'OFFLINE_AT_PROPERTY' },
      });

      booking.transactionId = offlineTxn._id;
      await booking.save();

      return successResponse(
        res,
        'Reservation confirmed. Upfront rent and deposit will be collected in cash at the property upon check-in.',
        {
          booking,
          transaction: offlineTxn,
          receiptId: booking.escrowReceiptId,
          transactionId: offlineTxn._id,
          escrowReceipt: {
            receiptId: booking.escrowReceiptId,
            bookingReference: booking.bookingReference,
            amountHeld: 0,
            securityDeposit: booking.costs.securityDeposit,
            monthlyRent: booking.costs.monthlyRent,
            paidAt: null,
            escrowStatus: booking.escrowStatus,
            paymentMethod: PAYMENT_METHODS.OFFLINE_CASH,
            transactionId: offlineTxn._id,
            transactionReference: offlineTxn.transactionReference,
          },
        },
        200
      );
    }

    // 4. Online Payment (UPI, CREDIT_CARD, DEBIT_CARD, NET_BANKING)
    const chosenMethod = paymentMethod in PAYMENT_METHODS ? paymentMethod : PAYMENT_METHODS.UPI;
    booking.paymentMethod = chosenMethod;
    booking.paymentStatus = PAYMENT_STATUS.ESCROW_HELD;
    booking.escrowStatus = ESCROW_STATUS.HELD_IN_ESCROW;
    booking.escrowPaidAt = new Date();

    if (!booking.escrowReceiptId) {
      const receiptHex = Math.random().toString(36).substring(2, 8).toUpperCase();
      booking.escrowReceiptId = `ESCROW-REC-${receiptHex}`;
    }

    // Advance status to ACCEPTED if still REQUESTED
    if (booking.status === BOOKING_STATUS.REQUESTED) {
      booking.status = BOOKING_STATUS.ACCEPTED;
    }

    const randHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const transaction = await Transaction.create({
      transactionReference: `SE-TXN-${Date.now()}-${randHex.slice(0, 4)}`,
      gatewayOrderId: `order_SE_${randHex}`,
      gatewayPaymentId: `pay_SE_${randHex}`,
      idempotencyKey: idempotencyKey || `IDEM-PAY-${booking._id}-${Date.now()}`,
      userId: req.user._id,
      ownerId: booking.ownerId,
      tenantId: booking.tenantId,
      propertyId: booking.propertyId,
      bookingId: booking._id,
      type: TRANSACTION_TYPES.DEPOSIT,
      category: 'DEBIT',
      amount: booking.costs.totalUpfrontAmount,
      feeAmount: Math.round(booking.costs.totalUpfrontAmount * 0.02),
      netAmount: booking.costs.totalUpfrontAmount,
      currency: 'INR',
      paymentMethod: chosenMethod,
      paymentGateway: 'RAZORPAY_MOCK',
      status: TRANSACTION_STATUS.SUCCESS,
      receiptNumber: booking.escrowReceiptId,
      paidAt: booking.escrowPaidAt,
      metadata: { purpose: 'DEPOSIT', referenceType: 'BOOKING', referenceId: booking._id },
    });

    booking.transactionId = transaction._id;
    await booking.save();

    // Trigger notification to Tenant & Owner
    await notificationService.notifyUser({
      userId: booking.tenantId,
      type: NOTIFICATION_TYPES.ESCROW_PAYMENT_SUCCESS,
      title: 'Escrow Protection Deposit Confirmed',
      message: `₹${booking.costs.totalUpfrontAmount.toLocaleString()} successfully deposited into StayEasy Escrow Protection via ${chosenMethod} (${booking.escrowReceiptId}).`,
      relatedEntity: { entityType: 'BOOKING', entityId: booking._id },
      actionUrl: '/dashboard/user',
      priority: NOTIFICATION_PRIORITY.HIGH,
    });

    await notificationService.notifyUser({
      userId: booking.ownerId,
      type: NOTIFICATION_TYPES.ESCROW_PAYMENT_SUCCESS,
      title: 'Tenant Escrow Payment Received',
      message: `Tenant deposited upfront rent & deposit (₹${booking.costs.totalUpfrontAmount.toLocaleString()}) via ${chosenMethod} into StayEasy Escrow Protection.`,
      relatedEntity: { entityType: 'BOOKING', entityId: booking._id },
      actionUrl: '/dashboard/owner',
      priority: NOTIFICATION_PRIORITY.MEDIUM,
    });

    return successResponse(
      res,
      'Upfront rent and security deposit successfully deposited into StayEasy Escrow Protection',
      {
        booking,
        transaction,
        receiptId: booking.escrowReceiptId,
        transactionId: transaction._id,
        escrowReceipt: {
          receiptId: booking.escrowReceiptId,
          bookingReference: booking.bookingReference,
          amountHeld: booking.costs.totalUpfrontAmount,
          securityDeposit: booking.costs.securityDeposit,
          monthlyRent: booking.costs.monthlyRent,
          paidAt: booking.escrowPaidAt,
          escrowStatus: booking.escrowStatus,
          paymentMethod: chosenMethod,
          transactionId: transaction._id,
          transactionReference: transaction.transactionReference,
        },
      },
      200
    );
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return errorResponse(res, 'Invalid booking ID format', 400);
    }
    next(error);
  }
};

/**
 * @desc    Settle Security Deposit Escrow at checkout (with damage deductions if any)
 * @route   POST /api/v1/bookings/:id/escrow/settle
 * @access  Private (Landlord or Admin)
 */
export const settleEscrowDeposit = async (req, res, next) => {
  try {
    const { damageDeductionAmount = 0, deductionReason = '' } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return errorResponse(res, 'Booking not found', 404);
    }

    // Ownership check: Landlord or Admin
    const isOwner = booking.ownerId.equals(req.user._id);
    const isAdmin = req.user.role === ROLES.ADMIN;
    if (!isOwner && !isAdmin) {
      return errorResponse(res, 'You are not authorized to settle escrow for this booking', 403);
    }

    // Checkout timing check: Checkout cannot happen before check-in!
    const validStatusesForSettlement = [
      BOOKING_STATUS.CHECKED_IN,
      BOOKING_STATUS.ACTIVE_STAY,
      BOOKING_STATUS.CHECKED_OUT,
    ];
    if (!validStatusesForSettlement.includes(booking.status)) {
      return errorResponse(
        res,
        'Cannot process checkout deposit settlement before tenant check-in has occurred',
        400
      );
    }

    // Prevent double settlement
    const settledStatuses = [
      ESCROW_STATUS.RELEASED_TO_OWNER,
      ESCROW_STATUS.REFUNDED_TO_TENANT,
      ESCROW_STATUS.PARTIALLY_REFUNDED,
    ];
    if (settledStatuses.includes(booking.escrowStatus)) {
      return errorResponse(res, 'Escrow deposit has already been settled for this booking', 400);
    }

    // Validate damage deduction amount
    const deductionNum = Number(damageDeductionAmount) || 0;
    if (deductionNum < 0) {
      return errorResponse(res, 'Damage deduction amount cannot be negative', 400);
    }
    if (deductionNum > booking.costs.securityDeposit) {
      return errorResponse(
        res,
        `Damage deduction amount (₹${deductionNum}) cannot exceed total security deposit (₹${booking.costs.securityDeposit})`,
        400
      );
    }

    const tenantRefundAmount = booking.costs.securityDeposit - deductionNum;
    const ownerPayoutAmount = deductionNum;

    // Determine final escrow status
    let finalEscrowStatus = ESCROW_STATUS.PARTIALLY_REFUNDED;
    if (deductionNum === 0) {
      finalEscrowStatus = ESCROW_STATUS.REFUNDED_TO_TENANT;
    } else if (deductionNum === booking.costs.securityDeposit) {
      finalEscrowStatus = ESCROW_STATUS.RELEASED_TO_OWNER;
    }

    booking.escrowStatus = finalEscrowStatus;
    booking.paymentStatus = PAYMENT_STATUS.REFUNDED;
    booking.escrowSettlement = {
      damageDeductionAmount: deductionNum,
      deductionReason: deductionReason ? deductionReason.trim() : 'Checkout inspection settlement',
      tenantRefundAmount,
      ownerPayoutAmount,
      settledAt: new Date(),
      settledBy: req.user._id,
    };

    const previousStatus = booking.status;
    booking.status = BOOKING_STATUS.CHECKED_OUT;
    booking.checkOutDate = new Date();

    await booking.save();

    // If transitioning to CHECKED_OUT for the first time, restore bed inventory
    if (previousStatus !== BOOKING_STATUS.CHECKED_OUT) {
      await Property.findOneAndUpdate(
        {
          _id: booking.propertyId,
          'roomConfigurations._id': booking.roomConfigId,
        },
        {
          $inc: { 'roomConfigurations.$.availableBeds': 1 },
        }
      );
    }

    // Trigger notification to Tenant
    await notificationService.notifyUser({
      userId: booking.tenantId,
      type: NOTIFICATION_TYPES.ESCROW_SETTLEMENT,
      title: 'Security Deposit Escrow Settled',
      message: `Checkout settlement completed. Deposit refund of ₹${tenantRefundAmount.toLocaleString()} released.`,
      relatedEntity: { entityType: 'BOOKING', entityId: booking._id },
      actionUrl: '/dashboard/user',
      priority: NOTIFICATION_PRIORITY.HIGH,
    });

    return successResponse(
      res,
      `Security Deposit Escrow settled successfully. Refund: ₹${tenantRefundAmount}, Deductions: ₹${deductionNum}`,
      { booking },
      200
    );

  } catch (error) {
    if (error.kind === 'ObjectId') {
      return errorResponse(res, 'Invalid booking ID format', 400);
    }
    next(error);
  }
};

/**
 * @desc    Get formal StayEasy Security Deposit Escrow Receipt
 * @route   GET /api/v1/bookings/:id/escrow/receipt
 * @access  Private (Tenant, Owner, or Admin)
 */
export const getEscrowReceipt = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('propertyId', 'title address depositRefundPolicy noticePeriodDays')
      .populate('tenantId', 'name email phone')
      .populate('ownerId', 'name email phone');

    if (!booking) {
      return errorResponse(res, 'Booking not found', 404);
    }

    // Authorization check
    const isTenant = booking.tenantId._id.equals(req.user._id);
    const isOwner = booking.ownerId._id.equals(req.user._id);
    const isAdmin = req.user.role === ROLES.ADMIN;

    if (!isTenant && !isOwner && !isAdmin) {
      return errorResponse(res, 'You are not authorized to view this escrow receipt', 403);
    }

    if (booking.escrowStatus === ESCROW_STATUS.PENDING_PAYMENT) {
      return errorResponse(res, 'Escrow receipt not generated yet. Payment is pending.', 400);
    }

    const receipt = {
      receiptId: booking.escrowReceiptId || `ESCROW-REC-${booking._id.toString().substring(18).toUpperCase()}`,
      bookingReference: booking.bookingReference,
      issuedAt: booking.escrowPaidAt || booking.updatedAt,
      tenant: {
        name: booking.tenantId?.name,
        email: booking.tenantId?.email,
      },
      landlord: {
        name: booking.ownerId?.name,
        email: booking.ownerId?.email,
      },
      property: {
        title: booking.propertyId?.title,
        address: booking.propertyId?.address,
        depositRefundPolicy: booking.propertyId?.depositRefundPolicy,
      },
      roomName: booking.roomName,
      roomType: booking.roomType,
      escrowFinancials: {
        securityDeposit: booking.costs.securityDeposit,
        monthlyRent: booking.costs.monthlyRent,
        foodCharges: booking.costs.foodCharges,
        totalUpfrontAmount: booking.costs.totalUpfrontAmount,
        escrowStatus: booking.escrowStatus,
        paymentStatus: booking.paymentStatus,
      },
      settlementDetails: booking.escrowSettlement || null,
      escrowGuarantee:
        'StayEasy Escrow Deposit Protection guarantees full security deposit return within 7 days of verified checkout inspection, subject to zero damage deductions.',
    };

    return successResponse(res, 'Escrow receipt retrieved successfully', { receipt }, 200);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return errorResponse(res, 'Invalid booking ID format', 400);
    }
    next(error);
  }
};
