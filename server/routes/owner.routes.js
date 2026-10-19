import { Router } from 'express';
import { getOwnerProfile, updateOwnerProfile } from '../controllers/owner.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Restricted to OWNER role
router.use(protect);
router.use(authorize(ROLES.OWNER));

router.route('/profile')
  .get(getOwnerProfile)
  .put(updateOwnerProfile);

export default router;
