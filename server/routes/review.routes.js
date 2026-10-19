import { Router } from 'express';
import {
  createReview,
  getReviewEligibility,
  getPropertyReviews,
  toggleHelpfulVote,
  ownerRespondToReview,
  flagReview,
  getMyTenantReviews,
  getOwnerPropertyReviews,
  getAdminFlaggedReviews,
  moderateReview,
} from '../controllers/review.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Public routes
router.get('/property/:propertyId', getPropertyReviews);

// Protected routes (require auth token)
router.use(protect);

router.post('/', authorize(ROLES.USER, ROLES.ADMIN), createReview);
router.get('/eligibility/:propertyId', getReviewEligibility);
router.post('/:id/helpful', toggleHelpfulVote);
router.post('/:id/flag', flagReview);

router.post('/:id/respond', authorize(ROLES.OWNER, ROLES.ADMIN), ownerRespondToReview);
router.get('/my-reviews', authorize(ROLES.USER, ROLES.ADMIN), getMyTenantReviews);
router.get('/owner-reviews', authorize(ROLES.OWNER, ROLES.ADMIN), getOwnerPropertyReviews);

// Admin routes
router.get('/admin/flagged', authorize(ROLES.ADMIN), getAdminFlaggedReviews);
router.patch('/:id/moderate', authorize(ROLES.ADMIN), moderateReview);

export default router;
