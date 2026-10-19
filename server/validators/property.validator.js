import { PROPERTY_TYPES, GENDER_PREFERENCE, ROOM_TYPES } from '../constants/roles.js';

export const validatePropertyInput = (data) => {
  const errors = [];

  const title = typeof data.title === 'string' ? data.title.trim() : '';
  const description = typeof data.description === 'string' ? data.description.trim() : '';
  const propertyType = typeof data.propertyType === 'string' ? data.propertyType.toUpperCase() : '';
  const city = data.address?.city ? data.address.city.trim() : '';
  const state = data.address?.state ? data.address.state.trim() : '';
  const pincode = data.address?.pincode ? data.address.pincode.trim() : '';

  if (!title) {
    errors.push('Property title is required');
  } else if (title.length < 3 || title.length > 150) {
    errors.push('Property title must be between 3 and 150 characters');
  }

  if (!description) {
    errors.push('Property description is required');
  }

  if (!propertyType || !Object.values(PROPERTY_TYPES).includes(propertyType)) {
    errors.push(`Invalid property type. Allowed types: ${Object.values(PROPERTY_TYPES).join(', ')}`);
  }

  if (!city) errors.push('City is required in address');
  if (!state) errors.push('State is required in address');
  if (!pincode) errors.push('Pincode is required in address');

  const hasImages = (data.images && Array.isArray(data.images) && data.images.length > 0) ||
    (data.photos && Array.isArray(data.photos) && data.photos.length > 0);

  if (!hasImages) {
    errors.push('At least one property photo URL is required');
  }

  const hasRooms = (data.rooms && Array.isArray(data.rooms) && data.rooms.length > 0);
  const hasConfigs = (data.roomConfigurations && Array.isArray(data.roomConfigurations) && data.roomConfigurations.length > 0);

  if (!hasRooms && !hasConfigs) {
    errors.push('At least one room configuration or room is required');
  }

  if (hasConfigs) {
    data.roomConfigurations.forEach((rc, idx) => {
      if (!rc.type || !Object.values(ROOM_TYPES).includes(rc.type)) {
        errors.push(`Room configuration #${idx + 1} has an invalid type`);
      }
      if (typeof rc.rent !== 'number' || rc.rent < 0) {
        errors.push(`Room configuration #${idx + 1} must have a valid non-negative rent`);
      }
      if (typeof rc.deposit !== 'number' || rc.deposit < 0) {
        errors.push(`Room configuration #${idx + 1} must have a valid non-negative deposit`);
      }
    });
  }

  if (hasRooms) {
    data.rooms.forEach((r, idx) => {
      if (!r.roomNumber) {
        errors.push(`Room #${idx + 1} must have a room number`);
      }
      if (typeof r.rent !== 'number' || r.rent < 0) {
        errors.push(`Room #${idx + 1} must have a valid non-negative rent`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
