import { maintenanceService } from '../services/maintenanceService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * @desc    Create a new maintenance complaint ticket
 * @route   POST /api/v1/maintenance
 * @access  Private (USER / Tenant)
 */
export const createTicket = async (req, res, next) => {
  try {
    const ticket = await maintenanceService.createTicket(req.user, req.body);
    return successResponse(
      res,
      'Maintenance ticket submitted successfully. Landlord has been notified.',
      { ticket },
      201
    );
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * @desc    Get tickets submitted by authenticated tenant
 * @route   GET /api/v1/maintenance/my-tickets
 * @access  Private (USER / Tenant)
 */
export const getMyTickets = async (req, res, next) => {
  try {
    const data = await maintenanceService.getMyTickets(req.user._id, req.query);
    return successResponse(res, 'Tenant maintenance tickets retrieved', data, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get tickets for properties owned by landlord
 * @route   GET /api/v1/maintenance/owner-tickets
 * @access  Private (OWNER / Landlord, ADMIN)
 */
export const getOwnerTickets = async (req, res, next) => {
  try {
    const data = await maintenanceService.getOwnerTickets(req.user._id, req.query);
    return successResponse(res, 'Owner maintenance tickets retrieved', data, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single ticket details with RBAC
 * @route   GET /api/v1/maintenance/:id
 * @access  Private (Authenticated)
 */
export const getTicketById = async (req, res, next) => {
  try {
    const ticket = await maintenanceService.getTicketById(req.params.id, req.user);
    return successResponse(res, 'Maintenance ticket details retrieved', { ticket }, 200);
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * @desc    Acknowledge a complaint ticket (Landlord action)
 * @route   PATCH /api/v1/maintenance/:id/acknowledge
 * @access  Private (OWNER, ADMIN)
 */
export const acknowledgeTicket = async (req, res, next) => {
  try {
    const ticket = await maintenanceService.acknowledgeTicket(
      req.params.id,
      req.user,
      req.body
    );
    return successResponse(res, 'Complaint acknowledged successfully', { ticket }, 200);
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * @desc    Start work / assign technician on a ticket (Landlord action)
 * @route   PATCH /api/v1/maintenance/:id/start
 * @access  Private (OWNER, ADMIN)
 */
export const startTicket = async (req, res, next) => {
  try {
    const ticket = await maintenanceService.startTicket(
      req.params.id,
      req.user,
      req.body
    );
    return successResponse(
      res,
      'Maintenance work marked as In Progress',
      { ticket },
      200
    );
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * @desc    Mark complaint as resolved with resolution notes (Landlord action)
 * @route   PATCH /api/v1/maintenance/:id/resolve
 * @access  Private (OWNER, ADMIN)
 */
export const resolveTicket = async (req, res, next) => {
  try {
    const ticket = await maintenanceService.resolveTicket(
      req.params.id,
      req.user,
      req.body
    );
    return successResponse(
      res,
      'Maintenance ticket marked as resolved. Tenant notified.',
      { ticket },
      200
    );
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * @desc    Close a resolved ticket (Tenant or Landlord)
 * @route   PATCH /api/v1/maintenance/:id/close
 * @access  Private (USER, OWNER, ADMIN)
 */
export const closeTicket = async (req, res, next) => {
  try {
    const ticket = await maintenanceService.closeTicket(
      req.params.id,
      req.user,
      req.body
    );
    return successResponse(res, 'Maintenance ticket closed successfully', { ticket }, 200);
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * @desc    Reopen an unresolved ticket (Tenant action)
 * @route   PATCH /api/v1/maintenance/:id/reopen
 * @access  Private (USER / Tenant)
 */
export const reopenTicket = async (req, res, next) => {
  try {
    const ticket = await maintenanceService.reopenTicket(
      req.params.id,
      req.user,
      req.body
    );
    return successResponse(
      res,
      'Maintenance ticket reopened. Landlord alerted with high priority.',
      { ticket },
      200
    );
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * @desc    Get SLA summary and turnaround metrics for Landlord
 * @route   GET /api/v1/maintenance/sla-summary
 * @access  Private (OWNER, ADMIN)
 */
export const getSLASummary = async (req, res, next) => {
  try {
    const ownerId = req.user.role === 'ADMIN' ? null : req.user._id;
    const summary = await maintenanceService.getSLASummary(ownerId, req.query.propertyId);
    return successResponse(res, 'SLA Turnaround metrics retrieved', { summary }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get platform-wide maintenance monitoring & audit overview
 * @route   GET /api/v1/maintenance/admin-overview
 * @access  Private (ADMIN only)
 */
export const getAdminOverview = async (req, res, next) => {
  try {
    const overview = await maintenanceService.getAdminOverview(req.query);
    return successResponse(
      res,
      'Admin maintenance monitoring metrics retrieved',
      { overview },
      200
    );
  } catch (error) {
    next(error);
  }
};
