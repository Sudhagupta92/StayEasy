import apiClient from './api';

export const analyticsService = {
  // ==========================================
  // OWNER ANALYTICS
  // ==========================================

  /**
   * Get high-level KPI overview for landlord
   */
  getOwnerOverview: async (params = {}) => {
    return await apiClient.get('/analytics/owner/overview', { params });
  },

  /**
   * Get monthly revenue trends for landlord
   */
  getOwnerRevenue: async (params = {}) => {
    return await apiClient.get('/analytics/owner/revenue', { params });
  },

  /**
   * Get monthly occupancy trends for landlord
   */
  getOwnerOccupancy: async (params = {}) => {
    return await apiClient.get('/analytics/owner/occupancy', { params });
  },

  /**
   * Get property-wise performance breakdown for landlord
   */
  getOwnerProperties: async (params = {}) => {
    return await apiClient.get('/analytics/owner/properties', { params });
  },

  /**
   * Get maintenance & SLA metrics for landlord
   */
  getOwnerMaintenance: async (params = {}) => {
    return await apiClient.get('/analytics/owner/maintenance', { params });
  },

  /**
   * Get platform-wide aggregate overview (Zero PII - safe for landlords)
   */
  getPlatformOverview: async () => {
    return await apiClient.get('/analytics/platform/overview');
  },

  // ==========================================
  // TENANT / USER ANALYTICS
  // ==========================================

  /**
   * Get high-level stay & spending overview for tenant
   */
  getUserOverview: async (params = {}) => {
    return await apiClient.get('/analytics/user/overview', { params });
  },

  /**
   * Get monthly spending breakdown for tenant
   */
  getUserSpending: async (params = {}) => {
    return await apiClient.get('/analytics/user/spending', { params });
  },

  /**
   * Get tenant maintenance telemetry and SLA status
   */
  getUserMaintenance: async (params = {}) => {
    return await apiClient.get('/analytics/user/maintenance', { params });
  },

  // ==========================================
  // ADMIN PLATFORM ANALYTICS
  // ==========================================

  /**
   * Get platform-wide overview for admin
   */
  getAdminOverview: async (params = {}) => {
    return await apiClient.get('/analytics/admin/overview', { params });
  },

  /**
   * Get platform growth and monthly trends for admin
   */
  getAdminTrends: async (params = {}) => {
    return await apiClient.get('/analytics/admin/trends', { params });
  },

  /**
   * Get top performing properties on the platform
   */
  getAdminTopProperties: async (params = {}) => {
    return await apiClient.get('/analytics/admin/top-properties', { params });
  },

  /**
   * Get platform maintenance telemetry and landlord SLA compliance ranking
   */
  getAdminMaintenance: async (params = {}) => {
    return await apiClient.get('/analytics/admin/maintenance', { params });
  },
};

export default analyticsService;
