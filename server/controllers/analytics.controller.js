import { analyticsService } from '../services/analyticsService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const analyticsController = {
  // ==========================================
  // OWNER ANALYTICS
  // ==========================================

  /**
   * GET /api/v1/analytics/owner/overview
   */
  getOwnerOverview: async (req, res, next) => {
    try {
      const data = await analyticsService.getOwnerOverview(req.user._id, req.query);
      return successResponse(res, 'Owner analytics overview retrieved successfully', data);
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  },

  /**
   * GET /api/v1/analytics/platform/overview (Owner & Admin safe aggregate overview)
   */
  getPlatformOverview: async (req, res, next) => {
    try {
      const data = await analyticsService.getPlatformOverview();
      return successResponse(res, 'Platform aggregate overview retrieved successfully', data);
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  },

  /**
   * GET /api/v1/analytics/owner/revenue
   */
  getOwnerRevenue: async (req, res, next) => {
    try {
      const data = await analyticsService.getOwnerRevenue(req.user._id, req.query);
      return successResponse(res, 'Owner revenue analytics retrieved successfully', data);
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  },

  /**
   * GET /api/v1/analytics/owner/occupancy
   */
  getOwnerOccupancy: async (req, res, next) => {
    try {
      const data = await analyticsService.getOwnerOccupancy(req.user._id, req.query);
      return successResponse(res, 'Owner occupancy analytics retrieved successfully', data);
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  },

  /**
   * GET /api/v1/analytics/owner/properties
   */
  getOwnerProperties: async (req, res, next) => {
    try {
      const data = await analyticsService.getOwnerProperties(req.user._id, req.query);
      return successResponse(res, 'Owner property performance analytics retrieved successfully', data);
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  },

  /**
   * GET /api/v1/analytics/owner/maintenance
   */
  getOwnerMaintenance: async (req, res, next) => {
    try {
      const data = await analyticsService.getOwnerMaintenance(req.user._id, req.query);
      return successResponse(res, 'Owner maintenance analytics retrieved successfully', data);
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  },

  // ==========================================
  // TENANT / USER ANALYTICS
  // ==========================================

  /**
   * GET /api/v1/analytics/user/overview
   */
  getUserOverview: async (req, res, next) => {
    try {
      const data = await analyticsService.getUserOverview(req.user._id, req.query);
      return successResponse(res, 'Tenant overview analytics retrieved successfully', data);
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  },

  /**
   * GET /api/v1/analytics/user/spending
   */
  getUserSpending: async (req, res, next) => {
    try {
      const data = await analyticsService.getUserSpending(req.user._id, req.query);
      return successResponse(res, 'Tenant spending analytics retrieved successfully', data);
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  },

  /**
   * GET /api/v1/analytics/user/maintenance
   */
  getUserMaintenance: async (req, res, next) => {
    try {
      const data = await analyticsService.getUserMaintenance(req.user._id, req.query);
      return successResponse(res, 'Tenant maintenance analytics retrieved successfully', data);
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  },

  // ==========================================
  // ADMIN PLATFORM ANALYTICS
  // ==========================================

  /**
   * GET /api/v1/analytics/admin/overview
   */
  getAdminOverview: async (req, res, next) => {
    try {
      const data = await analyticsService.getAdminOverview(req.query);
      return successResponse(res, 'Admin platform analytics overview retrieved successfully', data);
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  },

  /**
   * GET /api/v1/analytics/admin/trends
   */
  getAdminTrends: async (req, res, next) => {
    try {
      const data = await analyticsService.getAdminTrends(req.query);
      return successResponse(res, 'Admin platform trends retrieved successfully', data);
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  },

  /**
   * GET /api/v1/analytics/admin/top-properties
   */
  getAdminTopProperties: async (req, res, next) => {
    try {
      const data = await analyticsService.getAdminTopProperties(req.query);
      return successResponse(res, 'Admin top performing properties retrieved successfully', data);
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  },

  /**
   * GET /api/v1/analytics/admin/maintenance
   */
  getAdminMaintenance: async (req, res, next) => {
    try {
      const data = await analyticsService.getAdminMaintenance(req.query);
      return successResponse(res, 'Admin platform maintenance analytics retrieved successfully', data);
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  },
};

export default analyticsController;
