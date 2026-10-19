import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Protect all analytics routes with JWT authentication
router.use(protect);

// ==========================================
// OWNER ANALYTICS ROUTES (OWNER ONLY)
// ==========================================
router.get(
  '/owner/overview',
  authorize(ROLES.OWNER),
  analyticsController.getOwnerOverview
);

router.get(
  '/platform/overview',
  authorize(ROLES.OWNER, ROLES.ADMIN),
  analyticsController.getPlatformOverview
);

router.get(
  '/owner/revenue',
  authorize(ROLES.OWNER),
  analyticsController.getOwnerRevenue
);

router.get(
  '/owner/occupancy',
  authorize(ROLES.OWNER),
  analyticsController.getOwnerOccupancy
);

router.get(
  '/owner/properties',
  authorize(ROLES.OWNER),
  analyticsController.getOwnerProperties
);

router.get(
  '/owner/maintenance',
  authorize(ROLES.OWNER),
  analyticsController.getOwnerMaintenance
);

// ==========================================
// TENANT / USER ANALYTICS ROUTES (USER ONLY)
// ==========================================
router.get(
  '/user/overview',
  authorize(ROLES.USER),
  analyticsController.getUserOverview
);

router.get(
  '/user/spending',
  authorize(ROLES.USER),
  analyticsController.getUserSpending
);

router.get(
  '/user/maintenance',
  authorize(ROLES.USER),
  analyticsController.getUserMaintenance
);

// ==========================================
// ADMIN PLATFORM ANALYTICS ROUTES (ADMIN ONLY)
// ==========================================
router.get(
  '/admin/overview',
  authorize(ROLES.ADMIN),
  analyticsController.getAdminOverview
);

router.get(
  '/admin/trends',
  authorize(ROLES.ADMIN),
  analyticsController.getAdminTrends
);

router.get(
  '/admin/top-properties',
  authorize(ROLES.ADMIN),
  analyticsController.getAdminTopProperties
);

router.get(
  '/admin/maintenance',
  authorize(ROLES.ADMIN),
  analyticsController.getAdminMaintenance
);

export default router;
