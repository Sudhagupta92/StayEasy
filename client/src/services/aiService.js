import apiClient from './api';

export const aiService = {
  getPreferences: async () => {
    return await apiClient.get('/ai/preferences');
  },

  updatePreferences: async (data) => {
    return await apiClient.patch('/ai/preferences', data);
  },

  getRecommendations: async () => {
    return await apiClient.post('/ai/recommendations');
  },

  getTenantInsights: async () => {
    return await apiClient.get('/ai/tenant/insights');
  },

  getOccupancyPrediction: async (propertyId = '') => {
    return await apiClient.get(`/ai/owner/occupancy${propertyId ? `?propertyId=${propertyId}` : ''}`);
  },

  getRevenuePrediction: async (propertyId = '') => {
    return await apiClient.get(`/ai/owner/revenue${propertyId ? `?propertyId=${propertyId}` : ''}`);
  },

  getMaintenanceRisk: async (propertyId = '') => {
    return await apiClient.get(`/ai/owner/maintenance-risk${propertyId ? `?propertyId=${propertyId}` : ''}`);
  },

  getOwnerInsights: async () => {
    return await apiClient.get('/ai/owner/insights');
  },

  getAdminInsights: async () => {
    return await apiClient.get('/ai/admin/insights');
  },
};

export default aiService;
