import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import ownerRoutes from './owner.routes.js';
import adminRoutes from './admin.routes.js';
import propertyRoutes from './property.routes.js';
import bookingRoutes from './booking.routes.js';
import ledgerRoutes from './ledger.routes.js';
import reviewRoutes from './review.routes.js';
import notificationRoutes from './notification.routes.js';
import maintenanceRoutes from './maintenance.routes.js';
import analyticsRoutes from './analytics.routes.js';
import aiRoutes from './ai.routes.js';
import paymentRoutes from './payment.routes.js';
import { successResponse } from '../utils/apiResponse.js';

const apiRouter = Router();

// Base v1 root info
apiRouter.get('/', (req, res) => {
  return successResponse(res, 'StayEasy REST API v1 Base Route', {
    availableEndpoints: {
      health: '/api/v1/health',
      auth: {
        register: 'POST /api/v1/auth/register',
        login: 'POST /api/v1/auth/login',
        me: 'GET /api/v1/auth/me',
        logout: 'POST /api/v1/auth/logout',
      },
      users: {
        profile: 'GET, PUT /api/v1/users/profile',
      },
      owners: {
        profile: 'GET, PUT /api/v1/owners/profile',
      },
      properties: {
        all: 'GET /api/v1/properties',
        filterMeta: 'GET /api/v1/properties/filters/meta',
        single: 'GET /api/v1/properties/:id',
        create: 'POST /api/v1/properties',
        update: 'PUT /api/v1/properties/:id',
        delete: 'DELETE /api/v1/properties/:id',
        myListings: 'GET /api/v1/properties/my-listings',
        verify: 'PATCH /api/v1/properties/:id/verify',
      },
      bookings: {
        create: 'POST /api/v1/bookings',
        myBookings: 'GET /api/v1/bookings/my-bookings',
        ownerBookings: 'GET /api/v1/bookings/owner-bookings',
        ownerResidents: 'GET /api/v1/bookings/owner-residents',
        payEscrow: 'POST /api/v1/bookings/:id/escrow/pay',
        settleEscrow: 'POST /api/v1/bookings/:id/escrow/settle',
        escrowReceipt: 'GET /api/v1/bookings/:id/escrow/receipt',
        single: 'GET /api/v1/bookings/:id',
        cancel: 'POST /api/v1/bookings/:id/cancel',
        updateStatus: 'PATCH /api/v1/bookings/:id/status',
      },
      ledger: {
        createInvoice: 'POST /api/v1/ledger/invoice',
        myLedger: 'GET /api/v1/ledger/my-ledger',
        ownerLedger: 'GET /api/v1/ledger/owner-ledger',
        payInvoice: 'POST /api/v1/ledger/:id/pay',
        markPaid: 'PATCH /api/v1/ledger/:id/mark-paid',
        serveNotice: 'POST /api/v1/ledger/notice',
        singleInvoice: 'GET /api/v1/ledger/invoice/:id',
      },
      reviews: {
        create: 'POST /api/v1/reviews',
        eligibility: 'GET /api/v1/reviews/eligibility/:propertyId',
        propertyReviews: 'GET /api/v1/reviews/property/:propertyId',
        helpful: 'POST /api/v1/reviews/:id/helpful',
        respond: 'POST /api/v1/reviews/:id/respond',
        flag: 'POST /api/v1/reviews/:id/flag',
        myReviews: 'GET /api/v1/reviews/my-reviews',
        ownerReviews: 'GET /api/v1/reviews/owner-reviews',
        adminFlagged: 'GET /api/v1/reviews/admin/flagged',
        moderate: 'PATCH /api/v1/reviews/:id/moderate',
      },
      notifications: {
        all: 'GET /api/v1/notifications',
        unreadCount: 'GET /api/v1/notifications/unread-count',
        markRead: 'PATCH /api/v1/notifications/:id/read',
        markAllRead: 'PATCH /api/v1/notifications/read-all',
        delete: 'DELETE /api/v1/notifications/:id',
      },
      maintenance: {
        create: 'POST /api/v1/maintenance',
        myTickets: 'GET /api/v1/maintenance/my-tickets',
        ownerTickets: 'GET /api/v1/maintenance/owner-tickets',
        slaSummary: 'GET /api/v1/maintenance/sla-summary',
        adminOverview: 'GET /api/v1/maintenance/admin-overview',
        single: 'GET /api/v1/maintenance/:id',
        acknowledge: 'PATCH /api/v1/maintenance/:id/acknowledge',
        start: 'PATCH /api/v1/maintenance/:id/start',
        resolve: 'PATCH /api/v1/maintenance/:id/resolve',
        close: 'PATCH /api/v1/maintenance/:id/close',
        reopen: 'PATCH /api/v1/maintenance/:id/reopen',
      },
      analytics: {
        ownerOverview: 'GET /api/v1/analytics/owner/overview',
        ownerRevenue: 'GET /api/v1/analytics/owner/revenue',
        ownerOccupancy: 'GET /api/v1/analytics/owner/occupancy',
        ownerProperties: 'GET /api/v1/analytics/owner/properties',
        ownerMaintenance: 'GET /api/v1/analytics/owner/maintenance',
        userOverview: 'GET /api/v1/analytics/user/overview',
        userSpending: 'GET /api/v1/analytics/user/spending',
        userMaintenance: 'GET /api/v1/analytics/user/maintenance',
        adminOverview: 'GET /api/v1/analytics/admin/overview',
        adminTrends: 'GET /api/v1/analytics/admin/trends',
        adminTopProperties: 'GET /api/v1/analytics/admin/top-properties',
        adminMaintenance: 'GET /api/v1/analytics/admin/maintenance',
      },
      admin: {
        overview: 'GET /api/v1/admin/overview',
        properties: 'GET /api/v1/properties/admin/all',
      },
    },
  });
});

// Mounted Routes
apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/owners', ownerRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/properties', propertyRoutes);
apiRouter.use('/bookings', bookingRoutes);
apiRouter.use('/ledger', ledgerRoutes);
apiRouter.use('/reviews', reviewRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/maintenance', maintenanceRoutes);
apiRouter.use('/analytics', analyticsRoutes);
apiRouter.use('/ai', aiRoutes);
apiRouter.use('/payments', paymentRoutes);

export default apiRouter;


