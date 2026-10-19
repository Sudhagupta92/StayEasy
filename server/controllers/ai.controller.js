import { aiService } from '../services/aiService.js';
import { User } from '../models/User.js';
import { Property } from '../models/Property.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import mongoose from 'mongoose';

export const aiController = {
  /**
   * GET /api/v1/ai/preferences (USER)
   */
  getPreferences: async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id).lean();
      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }
      return successResponse(res, 'Tenant preferences retrieved successfully', user.preferences || {});
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/ai/preferences (USER)
   */
  updatePreferences: async (req, res, next) => {
    try {
      const { budgetMin, budgetMax, preferredLocations, preferredAmenities, preferredRoomType, foodPreference } = req.body;

      const updateData = {};
      if (budgetMin !== undefined) updateData['preferences.budgetMin'] = Number(budgetMin) || 0;
      if (budgetMax !== undefined) updateData['preferences.budgetMax'] = Number(budgetMax) || 50000;
      if (preferredLocations !== undefined) updateData['preferences.preferredLocations'] = Array.isArray(preferredLocations) ? preferredLocations : [];
      if (preferredAmenities !== undefined) updateData['preferences.preferredAmenities'] = Array.isArray(preferredAmenities) ? preferredAmenities : [];
      if (preferredRoomType !== undefined) updateData['preferences.preferredRoomType'] = preferredRoomType;
      if (foodPreference !== undefined) updateData['preferences.foodPreference'] = foodPreference;

      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).lean();

      return successResponse(res, 'Tenant preferences updated successfully', updatedUser.preferences);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/ai/recommendations (USER)
   */
  getRecommendations: async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id).lean();
      const preferences = user?.preferences || req.body?.preferences || {};

      const data = await aiService.getPropertyRecommendations(req.user._id, preferences);
      return successResponse(res, 'Property recommendations generated successfully', data);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/ai/tenant/insights (USER)
   */
  getTenantInsights: async (req, res, next) => {
    try {
      const data = await aiService.getTenantInsights(req.user._id);
      return successResponse(res, 'Tenant AI insights retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/ai/owner/occupancy (OWNER)
   */
  getOwnerOccupancy: async (req, res, next) => {
    try {
      const { propertyId } = req.query;
      if (propertyId) {
        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
          return errorResponse(res, 'Invalid property ID format', 400);
        }
        const prop = await Property.findOne({ _id: propertyId, ownerId: req.user._id });
        if (!prop) {
          return errorResponse(res, 'Property not found or does not belong to this owner', 404);
        }
      }

      const data = await aiService.predictOccupancy(req.user._id, propertyId);
      return successResponse(res, 'Occupancy prediction generated successfully', data);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/ai/owner/revenue (OWNER)
   */
  getOwnerRevenue: async (req, res, next) => {
    try {
      const { propertyId } = req.query;
      if (propertyId) {
        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
          return errorResponse(res, 'Invalid property ID format', 400);
        }
        const prop = await Property.findOne({ _id: propertyId, ownerId: req.user._id });
        if (!prop) {
          return errorResponse(res, 'Property not found or does not belong to this owner', 404);
        }
      }

      const data = await aiService.predictRevenue(req.user._id, propertyId);
      return successResponse(res, 'Revenue forecast generated successfully', data);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/ai/owner/maintenance-risk (OWNER)
   */
  getOwnerMaintenanceRisk: async (req, res, next) => {
    try {
      const { propertyId } = req.query;
      if (propertyId) {
        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
          return errorResponse(res, 'Invalid property ID format', 400);
        }
        const prop = await Property.findOne({ _id: propertyId, ownerId: req.user._id });
        if (!prop) {
          return errorResponse(res, 'Property not found or does not belong to this owner', 404);
        }
      }

      const data = await aiService.predictMaintenanceRisk(req.user._id, propertyId);
      return successResponse(res, 'Maintenance risk telemetry calculated successfully', data);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/ai/owner/insights (OWNER)
   */
  getOwnerInsights: async (req, res, next) => {
    try {
      const data = await aiService.getOwnerInsights(req.user._id);
      return successResponse(res, 'Owner AI intelligence retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/ai/admin/insights (ADMIN)
   */
  getAdminInsights: async (req, res, next) => {
    try {
      const data = await aiService.getAdminInsights();
      return successResponse(res, 'Admin platform intelligence retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  },
};

export default aiController;
