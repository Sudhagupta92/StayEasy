import apiClient from './api';

export const propertyService = {
  /**
   * Get all properties with filters, search, sorting & pagination
   */
  getProperties: async (params = {}) => {
    return await apiClient.get('/properties', { params });
  },

  /**
   * Get dynamic filter metadata (cities, bounds, amenities)
   */
  getFilterMeta: async () => {
    return await apiClient.get('/properties/filters/meta');
  },

  /**
   * Get single property by ID with complete breakdown & owner profile
   */
  getPropertyById: async (id) => {
    return await apiClient.get(`/properties/${id}`);
  },

  /**
   * Get listings belonging to current authenticated owner
   */
  getMyProperties: async () => {
    return await apiClient.get('/properties/my-listings');
  },

  /**
   * Create a new property listing (OWNER / ADMIN)
   */
  createProperty: async (propertyData) => {
    return await apiClient.post('/properties', propertyData);
  },

  /**
   * Update an existing property listing
   */
  updateProperty: async (id, propertyData) => {
    return await apiClient.put(`/properties/${id}`, propertyData);
  },

  /**
   * Delete a property listing
   */
  deleteProperty: async (id) => {
    return await apiClient.delete(`/properties/${id}`);
  },

  /**
   * Verify or reject a property listing (ADMIN only)
   */
  verifyProperty: async (id, verificationData) => {
    return await apiClient.patch(`/properties/${id}/verify`, verificationData);
  },

  /**
   * Get all properties for admin verification queue
   */
  getAdminProperties: async (params = {}) => {
    return await apiClient.get('/properties/admin/all', { params });
  },

  /**
   * Get property-level stats and KPIs
   */
  getPropertyStats: async (id) => {
    return await apiClient.get(`/properties/${id}/stats`);
  },

  /**
   * Get structured rooms and beds for a property
   */
  getPropertyRooms: async (id) => {
    return await apiClient.get(`/properties/${id}/rooms`);
  },

  /**
   * Add a room to a property
   */
  addRoom: async (id, roomData) => {
    return await apiClient.post(`/properties/${id}/rooms`, roomData);
  },

  /**
   * Update a room in a property
   */
  updateRoom: async (id, roomId, roomData) => {
    return await apiClient.put(`/properties/${id}/rooms/${roomId}`, roomData);
  },

  /**
   * Delete a room from a property
   */
  deleteRoom: async (id, roomId) => {
    return await apiClient.delete(`/properties/${id}/rooms/${roomId}`);
  },

  /**
   * Update status of a specific bed
   */
  updateBedStatus: async (id, roomId, bedId, statusData) => {
    return await apiClient.patch(`/properties/${id}/rooms/${roomId}/beds/${bedId}/status`, statusData);
  },

  /**
   * Add a photo to a property with category
   */
  addPropertyPhoto: async (id, photoData) => {
    return await apiClient.post(`/properties/${id}/photos`, photoData);
  },

  /**
   * Delete a photo from a property
   */
  deletePropertyPhoto: async (id, photoId) => {
    return await apiClient.delete(`/properties/${id}/photos/${photoId}`);
  },
};

export default propertyService;

