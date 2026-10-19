import { RentLedger } from '../models/RentLedger.js';
import { Booking } from '../models/Booking.js';
import { Property } from '../models/Property.js';
import { User } from '../models/User.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { ROLES, BOOKING_STATUS, NOTIFICATION_TYPES, NOTIFICATION_PRIORITY } from '../constants/roles.js';
import { notificationService } from '../services/notificationService.js';


/**
 * @desc    Generate a monthly rent invoice for an active resident (Landlord/Admin)
 * @route   POST /api/v1/ledger/invoice
 * @access  Private (OWNER / ADMIN)
 */
export const createRentInvoice = async (req, res, next) => {
  try {
    const {
      bookingId,
      billingMonth,
      dueDate,
      previousMeterReading = 0,
      currentMeterReading = 0,
      waterCharges = 0,
      maintenanceCharges = 0,
      foodCharges = 0,
      otherCharges = 0,
      otherChargesDescription = '',
      notes = '',
    } = req.body;

    if (!bookingId || !billingMonth || !dueDate) {
      return errorResponse(res, 'Booking ID, billing month, and due date are required', 400);
    }

    // 1. Find booking
    const booking = await Booking.findById(bookingId).populate('propertyId');
    if (!booking) {
      return errorResponse(res, 'Associated booking record not found', 404);
    }

    // 2. Ownership check
    const isOwner = booking.ownerId.equals(req.user._id);
    const isAdmin = req.user.role === ROLES.ADMIN;
    if (!isOwner && !isAdmin) {
      return errorResponse(res, 'You are not authorized to issue invoices for this resident', 403);
    }

    // 3. Status check: must be active stay
    const activeStatuses = [
      BOOKING_STATUS.CHECKED_IN,
      BOOKING_STATUS.ACTIVE_STAY,
      BOOKING_STATUS.ACCEPTED,
      BOOKING_STATUS.CONFIRMED,
    ];
    if (!activeStatuses.includes(booking.status)) {
      return errorResponse(
        res,
        `Cannot issue rent invoice for a booking with status: ${booking.status}`,
        400
      );
    }

    // 4. Calculate sub-meter electricity
    const prevMeter = Number(previousMeterReading) || 0;
    const currMeter = Number(currentMeterReading) || 0;

    if (currMeter < prevMeter) {
      return errorResponse(res, 'Current meter reading cannot be less than previous reading', 400);
    }

    const unitsConsumed = currMeter - prevMeter;
    const property = booking.propertyId;
    const ratePerUnit = property?.expenses?.electricity?.rate || 8;
    const electricityType = property?.expenses?.electricity?.type || 'PER_UNIT';

    let electricityAmount = 0;
    if (electricityType === 'PER_UNIT') {
      electricityAmount = Math.round(unitsConsumed * ratePerUnit);
    } else if (electricityType === 'FIXED') {
      electricityAmount = ratePerUnit;
    }

    const baseRent = booking.costs?.monthlyRent || 0;
    const waterNum = Number(waterCharges) || 0;
    const maintenanceNum = Number(maintenanceCharges) || 0;
    const foodNum = Number(foodCharges) || 0;
    const otherNum = Number(otherCharges) || 0;

    const totalAmount = baseRent + electricityAmount + waterNum + maintenanceNum + foodNum + otherNum;

    // 5. Create Rent Ledger Invoice
    const invoice = await RentLedger.create({
      bookingId: booking._id,
      propertyId: property._id,
      tenantId: booking.tenantId,
      ownerId: booking.ownerId,
      billingMonth: billingMonth.trim(),
      dueDate: new Date(dueDate),
      breakdown: {
        baseRent,
        electricity: {
          previousMeterReading: prevMeter,
          currentMeterReading: currMeter,
          unitsConsumed,
          ratePerUnit,
          amount: electricityAmount,
          description: `Sub-metered electricity (${unitsConsumed} kWh @ ₹${ratePerUnit}/unit)`,
        },
        waterCharges: waterNum,
        maintenanceCharges: maintenanceNum,
        foodCharges: foodNum,
        otherCharges: otherNum,
        otherChargesDescription: otherChargesDescription.trim(),
        lateFee: 0,
      },
      totalAmount,
      amountPaid: 0,
      balanceDue: totalAmount,
      status: 'DUE',
      notes: notes.trim(),
    });

    // Trigger notification to Tenant
    await notificationService.notifyUser({
      userId: booking.tenantId,
      type: NOTIFICATION_TYPES.RENT_INVOICE_GENERATED,
      title: `Rent Invoice Generated (${billingMonth})`,
      message: `Your monthly rent invoice of ₹${totalAmount.toLocaleString()} for ${billingMonth} is generated. Due: ${new Date(dueDate).toLocaleDateString()}.`,
      relatedEntity: { entityType: 'LEDGER_INVOICE', entityId: invoice._id },
      actionUrl: '/dashboard/user',
      priority: NOTIFICATION_PRIORITY.HIGH,
    });

    return successResponse(
      res,
      `Monthly rent invoice ${invoice.invoiceNumber} generated successfully`,
      { invoice },
      201
    );

  } catch (error) {
    if (error.kind === 'ObjectId') {
      return errorResponse(res, 'Invalid booking ID format', 400);
    }
    next(error);
  }
};

/**
 * @desc    Get tenant digital rent ledger statement & history
 * @route   GET /api/v1/ledger/my-ledger
 * @access  Private (USER / Tenant)
 */
export const getTenantLedger = async (req, res, next) => {
  try {
    const invoices = await RentLedger.find({ tenantId: req.user._id })
      .populate('propertyId', 'title address propertyType')
      .populate('ownerId', 'name email phone')
      .sort({ createdAt: -1 });

    const totalPaidAmount = invoices
      .filter((inv) => inv.status === 'PAID')
      .reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);

    const totalOutstandingDue = invoices
      .filter((inv) => inv.status === 'DUE' || inv.status === 'OVERDUE')
      .reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);

    const overdueCount = invoices.filter((inv) => inv.status === 'OVERDUE').length;

    return successResponse(
      res,
      'Tenant rent ledger retrieved successfully',
      {
        invoices,
        summary: {
          totalPaidAmount,
          totalOutstandingDue,
          overdueCount,
          totalInvoicesCount: invoices.length,
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get owner collection ledger & invoices statement
 * @route   GET /api/v1/ledger/owner-ledger
 * @access  Private (OWNER / ADMIN)
 */
export const getOwnerLedger = async (req, res, next) => {
  try {
    const query = req.user.role === ROLES.ADMIN ? {} : { ownerId: req.user._id };

    const invoices = await RentLedger.find(query)
      .populate('tenantId', 'name email phone occupation avatar')
      .populate('propertyId', 'title address')
      .sort({ createdAt: -1 });

    const totalCollectedRent = invoices
      .filter((inv) => inv.status === 'PAID')
      .reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);

    const pendingDueRent = invoices
      .filter((inv) => inv.status === 'DUE' || inv.status === 'OVERDUE')
      .reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);

    const overdueCount = invoices.filter((inv) => inv.status === 'OVERDUE').length;

    return successResponse(
      res,
      'Owner collection ledger retrieved successfully',
      {
        invoices,
        summary: {
          totalCollectedRent,
          pendingDueRent,
          overdueCount,
          totalInvoicesCount: invoices.length,
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Pay monthly rent invoice online (Tenant action)
 * @route   POST /api/v1/ledger/:id/pay
 * @access  Private (USER / Tenant or ADMIN)
 */
export const payRentInvoice = async (req, res, next) => {
  try {
    const { paymentMethod = 'UPI' } = req.body;
    const invoice = await RentLedger.findById(req.params.id);

    if (!invoice) {
      return errorResponse(res, 'Rent invoice not found', 404);
    }

    // Ownership check
    const isTenant = invoice.tenantId.equals(req.user._id);
    const isAdmin = req.user.role === ROLES.ADMIN;
    if (!isTenant && !isAdmin) {
      return errorResponse(res, 'You are not authorized to pay this rent invoice', 403);
    }

    if (invoice.status === 'PAID') {
      return errorResponse(res, 'Rent invoice has already been paid', 400);
    }

    // Process payment simulation
    invoice.status = 'PAID';
    invoice.amountPaid = invoice.totalAmount;
    invoice.balanceDue = 0;
    invoice.paidAt = new Date();
    invoice.paymentMethod = paymentMethod;
    invoice.paymentReference = `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    await invoice.save();

    // Trigger notification to Tenant & Owner
    await notificationService.notifyUser({
      userId: invoice.tenantId,
      type: NOTIFICATION_TYPES.RENT_PAYMENT_SUCCESS,
      title: 'Rent Payment Successful',
      message: `Rent payment of ₹${invoice.totalAmount.toLocaleString()} for ${invoice.billingMonth} recorded (${invoice.paymentReference}).`,
      relatedEntity: { entityType: 'LEDGER_INVOICE', entityId: invoice._id },
      actionUrl: '/dashboard/user',
      priority: NOTIFICATION_PRIORITY.MEDIUM,
    });

    await notificationService.notifyUser({
      userId: invoice.ownerId,
      type: NOTIFICATION_TYPES.RENT_PAYMENT_SUCCESS,
      title: 'Tenant Rent Received',
      message: `Rent payment of ₹${invoice.totalAmount.toLocaleString()} received for ${invoice.billingMonth} (${invoice.paymentMethod}).`,
      relatedEntity: { entityType: 'LEDGER_INVOICE', entityId: invoice._id },
      actionUrl: '/dashboard/owner',
      priority: NOTIFICATION_PRIORITY.MEDIUM,
    });

    return successResponse(
      res,
      `Rent invoice ${invoice.invoiceNumber} paid successfully. Digital receipt generated.`,
      { invoice },
      200
    );
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return errorResponse(res, 'Invalid invoice ID format', 400);
    }
    next(error);
  }
};

/**
 * @desc    Mark rent invoice as paid offline (Landlord action)
 * @route   PATCH /api/v1/ledger/:id/mark-paid
 * @access  Private (OWNER / ADMIN)
 */
export const markInvoicePaid = async (req, res, next) => {
  try {
    const { paymentMethod = 'CASH', paymentReference = 'OFFLINE_COLLECTION' } = req.body;
    const invoice = await RentLedger.findById(req.params.id);

    if (!invoice) {
      return errorResponse(res, 'Rent invoice not found', 404);
    }

    // Ownership check
    const isOwner = invoice.ownerId.equals(req.user._id);
    const isAdmin = req.user.role === ROLES.ADMIN;
    if (!isOwner && !isAdmin) {
      return errorResponse(res, 'You are not authorized to mark this invoice as paid', 403);
    }

    if (invoice.status === 'PAID') {
      return errorResponse(res, 'Rent invoice has already been paid', 400);
    }

    invoice.status = 'PAID';
    invoice.amountPaid = invoice.totalAmount;
    invoice.balanceDue = 0;
    invoice.paidAt = new Date();
    invoice.paymentMethod = paymentMethod;
    invoice.paymentReference = paymentReference;

    await invoice.save();

    // Trigger notification to Tenant & Owner
    await notificationService.notifyUser({
      userId: invoice.tenantId,
      type: NOTIFICATION_TYPES.RENT_PAYMENT_SUCCESS,
      title: 'Rent Receipt Issued (Offline Payment)',
      message: `Landlord confirmed rent payment of ₹${invoice.totalAmount.toLocaleString()} for ${invoice.billingMonth}.`,
      relatedEntity: { entityType: 'LEDGER_INVOICE', entityId: invoice._id },
      actionUrl: '/dashboard/user',
      priority: NOTIFICATION_PRIORITY.MEDIUM,
    });

    return successResponse(
      res,
      `Rent invoice ${invoice.invoiceNumber} marked as PAID.`,
      { invoice },
      200
    );

  } catch (error) {
    if (error.kind === 'ObjectId') {
      return errorResponse(res, 'Invalid invoice ID format', 400);
    }
    next(error);
  }
};

/**
 * @desc    Tenant submits formal move-out notice
 * @route   POST /api/v1/ledger/notice
 * @access  Private (USER / Tenant)
 */
export const serveMoveOutNotice = async (req, res, next) => {
  try {
    const { bookingId, intendedCheckoutDate, reason = '' } = req.body;

    if (!bookingId || !intendedCheckoutDate) {
      return errorResponse(res, 'Booking ID and intended checkout date are required', 400);
    }

    const booking = await Booking.findById(bookingId).populate('propertyId');
    if (!booking) {
      return errorResponse(res, 'Booking record not found', 404);
    }

    // Ownership check
    if (!booking.tenantId.equals(req.user._id)) {
      return errorResponse(res, 'You are not authorized to serve notice for this booking', 403);
    }

    const activeStatuses = [
      BOOKING_STATUS.CHECKED_IN,
      BOOKING_STATUS.ACTIVE_STAY,
      BOOKING_STATUS.ACCEPTED,
      BOOKING_STATUS.CONFIRMED,
    ];
    if (!activeStatuses.includes(booking.status)) {
      return errorResponse(
        res,
        `Cannot serve move-out notice for a stay with status: ${booking.status}`,
        400
      );
    }

    // Validate Notice Period Days
    const noticeDays = booking.propertyId?.noticePeriodDays || 30;
    const requestedCheckout = new Date(intendedCheckoutDate);
    const minNoticeDate = new Date();
    minNoticeDate.setDate(minNoticeDate.getDate() + noticeDays - 1); // allow exact notice period days

    if (requestedCheckout < minNoticeDate) {
      return errorResponse(
        res,
        `Intended checkout date must satisfy the required ${noticeDays}-day notice period (earliest allowed date: ${minNoticeDate.toISOString().split('T')[0]})`,
        400
      );
    }

    // Update booking status to ACTIVE_STAY or keep active, record notice
    booking.ownerNotes = `[NOTICE SERVED]: Intended checkout on ${requestedCheckout.toLocaleDateString()}. Reason: ${reason}`;
    await booking.save();

    // Trigger notification to Owner
    await notificationService.notifyUser({
      userId: booking.ownerId,
      type: NOTIFICATION_TYPES.MOVEOUT_NOTICE_SERVED,
      title: 'Move-Out Notice Received',
      message: `Tenant served formal move-out notice for ${requestedCheckout.toLocaleDateString()} (${noticeDays}-day notice period).`,
      relatedEntity: { entityType: 'BOOKING', entityId: booking._id },
      actionUrl: '/dashboard/owner',
      priority: NOTIFICATION_PRIORITY.HIGH,
    });

    return successResponse(
      res,
      `Formal move-out notice served successfully for ${requestedCheckout.toLocaleDateString()}`,

      {
        bookingId: booking._id,
        noticePeriodDays: noticeDays,
        intendedCheckoutDate: requestedCheckout,
        reason,
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
 * @desc    Get single invoice & printable digital rent receipt details
 * @route   GET /api/v1/ledger/invoice/:id
 * @access  Private (Tenant, Owner, or Admin)
 */
export const getLedgerInvoiceById = async (req, res, next) => {
  try {
    const invoice = await RentLedger.findById(req.params.id)
      .populate('propertyId', 'title address propertyType depositRefundPolicy')
      .populate('tenantId', 'name email phone occupation')
      .populate('ownerId', 'name email phone');

    if (!invoice) {
      return errorResponse(res, 'Rent invoice not found', 404);
    }

    // Authorization check
    const isTenant = invoice.tenantId._id.equals(req.user._id);
    const isOwner = invoice.ownerId._id.equals(req.user._id);
    const isAdmin = req.user.role === ROLES.ADMIN;

    if (!isTenant && !isOwner && !isAdmin) {
      return errorResponse(res, 'You are not authorized to view this invoice', 403);
    }

    return successResponse(res, 'Rent invoice details retrieved', { invoice }, 200);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return errorResponse(res, 'Invalid invoice ID format', 400);
    }
    next(error);
  }
};
