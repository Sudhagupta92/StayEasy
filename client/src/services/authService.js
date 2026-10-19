import apiClient from './api';

export const authService = {
  /**
   * Register a new user or owner
   */
  register: async (userData) => {
    return await apiClient.post('/auth/register', userData);
  },

  /**
   * Login user
   */
  login: async (credentials) => {
    return await apiClient.post('/auth/login', credentials);
  },

  /**
   * Get current authenticated user
   */
  getMe: async () => {
    return await apiClient.get('/auth/me');
  },

  /**
   * Logout user
   */
  logout: async () => {
    return await apiClient.post('/auth/logout');
  },

  /**
   * Update tenant/user profile
   */
  updateProfile: async (profileData) => {
    return await apiClient.put('/users/profile', profileData);
  },

  /**
   * Get owner profile
   */
  getOwnerProfile: async () => {
    return await apiClient.get('/owners/profile');
  },

  /**
   * Update owner profile
   */
  updateOwnerProfile: async (ownerData) => {
    return await apiClient.put('/owners/profile', ownerData);
  },

  /**
   * Get admin overview metrics
   */
  getAdminOverview: async () => {
    return await apiClient.get('/admin/overview');
  },
};

export default authService;
