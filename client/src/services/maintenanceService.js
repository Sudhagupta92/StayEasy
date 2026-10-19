import apiClient from './api';

export const maintenanceService = {
  /**
   * Create a new maintenance ticket (Tenant)
   */
  createTicket: async (ticketData) => {
    return await apiClient.post('/maintenance', ticketData);
  },

  /**
   * Get tickets submitted by current logged-in tenant
   */
  getMyTickets: async (params = {}) => {
    return await apiClient.get('/maintenance/my-tickets', { params });
  },

  /**
   * Get tickets for properties belonging to logged-in landlord
   */
  getOwnerTickets: async (params = {}) => {
    return await apiClient.get('/maintenance/owner-tickets', { params });
  },

  /**
   * Get single ticket details by ID
   */
  getTicketById: async (id) => {
    return await apiClient.get(`/maintenance/${id}`);
  },

  /**
   * Landlord acknowledges a ticket
   */
  acknowledgeTicket: async (id, data = {}) => {
    return await apiClient.patch(`/maintenance/${id}/acknowledge`, data);
  },

  /**
   * Landlord starts work / assigns technician
   */
  startTicket: async (id, data = {}) => {
    return await apiClient.patch(`/maintenance/${id}/start`, data);
  },

  /**
   * Landlord marks ticket as resolved
   */
  resolveTicket: async (id, data = {}) => {
    return await apiClient.patch(`/maintenance/${id}/resolve`, data);
  },

  /**
   * Close a resolved ticket
   */
  closeTicket: async (id, data = {}) => {
    return await apiClient.patch(`/maintenance/${id}/close`, data);
  },

  /**
   * Tenant reopens an unresolved ticket
   */
  reopenTicket: async (id, data = {}) => {
    return await apiClient.patch(`/maintenance/${id}/reopen`, data);
  },

  /**
   * Get SLA turnaround summary metrics (Landlord / Admin)
   */
  getSLASummary: async (params = {}) => {
    return await apiClient.get('/maintenance/sla-summary', { params });
  },

  /**
   * Get platform maintenance monitoring metrics (Admin)
   */
  getAdminOverview: async (params = {}) => {
    return await apiClient.get('/maintenance/admin-overview', { params });
  },
};

export default maintenanceService;
