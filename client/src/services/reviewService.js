import apiClient from './api';

export const reviewService = {
  /**
   * Submit a new verified resident review
   */
  createReview: async (reviewData) => {
    return await apiClient.post('/reviews', reviewData);
  },

  /**
   * Check if authenticated user is eligible to review a property
   */
  getReviewEligibility: async (propertyId) => {
    return await apiClient.get(`/reviews/eligibility/${propertyId}`);
  },

  /**
   * Get approved reviews for a property
   */
  getPropertyReviews: async (propertyId, params = {}) => {
    return await apiClient.get(`/reviews/property/${propertyId}`, { params });
  },

  /**
   * Toggle helpful / unhelpful vote on a review
   */
  toggleHelpfulVote: async (reviewId, type = 'helpful') => {
    return await apiClient.post(`/reviews/${reviewId}/helpful`, { type });
  },

  /**
   * Owner respond to a resident review
   */
  ownerRespondToReview: async (reviewId, responseText) => {
    return await apiClient.post(`/reviews/${reviewId}/respond`, { responseText });
  },

  /**
   * Report/Flag an abusive review
   */
  flagReview: async (reviewId, reason) => {
    return await apiClient.post(`/reviews/${reviewId}/flag`, { reason });
  },

  /**
   * Get all reviews created by logged-in tenant
   */
  getMyTenantReviews: async () => {
    return await apiClient.get('/reviews/my-reviews');
  },

  /**
   * Get all reviews received on properties owned by landlord
   */
  getOwnerPropertyReviews: async () => {
    return await apiClient.get('/reviews/owner-reviews');
  },

  /**
   * Admin view all flagged or pending reviews
   */
  getAdminFlaggedReviews: async () => {
    return await apiClient.get('/reviews/admin/flagged');
  },

  /**
   * Admin moderate review status
   */
  moderateReview: async (reviewId, status, notes = '') => {
    return await apiClient.patch(`/reviews/${reviewId}/moderate`, { status, notes });
  },
};

export default reviewService;
