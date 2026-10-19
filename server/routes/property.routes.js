import { Router } from 'express';
import {
  getProperties,
  getPropertyFilterMeta,
  getPropertyById,
  getMyProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  verifyProperty,
  getAdminProperties,
  getPropertyStats,
  getPropertyRooms,
  addRoom,
  updateRoom,
  deleteRoom,
  updateBedStatus,
  addPropertyPhoto,
  deletePropertyPhoto,
} from '../controllers/property.controller.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Public routes
router.get('/', getProperties);
router.get('/filters/meta', getPropertyFilterMeta);

// Owner routes (Must come before /:id parameter)
router.get('/my-listings', protect, authorize(ROLES.OWNER, ROLES.ADMIN), getMyProperties);

// Admin routes
router.get('/admin/all', protect, authorize(ROLES.ADMIN), getAdminProperties);
router.patch('/:id/verify', protect, authorize(ROLES.ADMIN), verifyProperty);

// Property Stats (Owner / Admin)
router.get('/:id/stats', protect, authorize(ROLES.OWNER, ROLES.ADMIN), getPropertyStats);

// Rooms & Beds endpoints
router.get('/:id/rooms', getPropertyRooms);
router.post('/:id/rooms', protect, authorize(ROLES.OWNER, ROLES.ADMIN), addRoom);
router.put('/:id/rooms/:roomId', protect, authorize(ROLES.OWNER, ROLES.ADMIN), updateRoom);
router.delete('/:id/rooms/:roomId', protect, authorize(ROLES.OWNER, ROLES.ADMIN), deleteRoom);
router.patch(
  '/:id/rooms/:roomId/beds/:bedId/status',
  protect,
  authorize(ROLES.OWNER, ROLES.ADMIN),
  updateBedStatus
);
router.patch(
  '/:id/beds/:bedId/status',
  protect,
  authorize(ROLES.OWNER, ROLES.ADMIN),
  updateBedStatus
);

// Photos endpoints
router.post('/:id/photos', protect, authorize(ROLES.OWNER, ROLES.ADMIN), addPropertyPhoto);
router.delete('/:id/photos/:photoId', protect, authorize(ROLES.OWNER, ROLES.ADMIN), deletePropertyPhoto);

// Single property details (Public)
router.get('/:id', getPropertyById);

// Owner CRUD
router.post('/', protect, authorize(ROLES.OWNER, ROLES.ADMIN), createProperty);
router.put('/:id', protect, authorize(ROLES.OWNER, ROLES.ADMIN), updateProperty);
router.delete('/:id', protect, authorize(ROLES.OWNER, ROLES.ADMIN), deleteProperty);

export default router;

