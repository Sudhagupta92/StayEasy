import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';
import { aiController } from '../controllers/ai.controller.js';

const router = express.Router();

// Apply Authentication to all AI routes
router.use(protect);

// Tenant (USER) Routes
router.get('/preferences', authorize(ROLES.USER), aiController.getPreferences);
router.patch('/preferences', authorize(ROLES.USER), aiController.updatePreferences);
router.post('/recommendations', authorize(ROLES.USER), aiController.getRecommendations);
router.get('/tenant/insights', authorize(ROLES.USER), aiController.getTenantInsights);

// Landlord (OWNER) Routes
router.get('/owner/occupancy', authorize(ROLES.OWNER), aiController.getOwnerOccupancy);
router.get('/owner/revenue', authorize(ROLES.OWNER), aiController.getOwnerRevenue);
router.get('/owner/maintenance-risk', authorize(ROLES.OWNER), aiController.getOwnerMaintenanceRisk);
router.get('/owner/insights', authorize(ROLES.OWNER), aiController.getOwnerInsights);

// Platform Regulator (ADMIN) Routes
router.get('/admin/insights', authorize(ROLES.ADMIN), aiController.getAdminInsights);

export default router;
