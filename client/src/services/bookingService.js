import apiClient from './api';

export const bookingService = {
  /**
   * Create a new booking / seat reservation
   */
  createBooking: async (bookingData) => {
    return await apiClient.post('/bookings', bookingData);
  },

  /**
   * Get all bookings for authenticated tenant
   */
  getMyBookings: async () => {
    return await apiClient.get('/bookings/my-bookings');
  },

  /**
   * Get single booking details
   */
  getBookingById: async (id) => {
    return await apiClient.get(`/bookings/${id}`);
  },

  /**
   * Cancel a booking (Tenant action)
   */
  cancelBooking: async (id, reason) => {
    return await apiClient.post(`/bookings/${id}/cancel`, { reason });
  },

  /**
   * Get incoming bookings for owner
   */
  getOwnerBookings: async (params = {}) => {
    return await apiClient.get('/bookings/owner-bookings', { params });
  },

  /**
   * Update stay lifecycle status (Owner action)
   */
  updateBookingStatus: async (id, status, notes = '') => {
    return await apiClient.patch(`/bookings/${id}/status`, { status, notes });
  },

  /**
   * Get active residents list for owner occupancy management
   */
  getOwnerResidents: async () => {
    return await apiClient.get('/bookings/owner-residents');
  },

  /**
   * Simulate payment of upfront rent + deposit into Escrow Protection
   */
  payEscrowDeposit: async (id, paymentData = {}) => {
    return await apiClient.post(`/bookings/${id}/escrow/pay`, paymentData);
  },

  /**
   * Settle Security Deposit Escrow at checkout
   */
  settleEscrowDeposit: async (id, settlementData = {}) => {
    return await apiClient.post(`/bookings/${id}/escrow/settle`, settlementData);
  },

  /**
   * Get StayEasy Security Deposit Escrow Receipt
   */
  getEscrowReceipt: async (id) => {
    return await apiClient.get(`/bookings/${id}/escrow/receipt`);
  },
};

export default bookingService;
