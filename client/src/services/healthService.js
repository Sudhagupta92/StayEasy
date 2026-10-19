import apiClient from './api';

/**
 * Health check API service to verify backend connection
 */
export const healthService = {
  getHealth: async () => {
    try {
      const res = await apiClient.get('/health');
      return {
        success: true,
        data: res.data,
        message: res.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },
};
