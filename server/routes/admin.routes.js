import { Router } from 'express';
import { getAdminOverview } from '../controllers/admin.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Restricted to ADMIN role
router.use(protect);
router.use(authorize(ROLES.ADMIN));

router.get('/overview', getAdminOverview);

export default router;
