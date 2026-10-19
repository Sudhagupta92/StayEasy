import mongoose from 'mongoose';

export const validateBookingInput = (data) => {
  const errors = [];

  const propertyId = data.propertyId;
  const roomConfigId = data.roomConfigId;
  const moveInDate = data.moveInDate;

  if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
    errors.push('A valid Property ID is required');
  }

  if (!roomConfigId || !mongoose.Types.ObjectId.isValid(roomConfigId)) {
    errors.push('A valid Room Configuration ID is required');
  }

  if (!moveInDate) {
    errors.push('Preferred move-in date is required');
  } else {
    const parsedDate = new Date(moveInDate);
    if (isNaN(parsedDate.getTime())) {
      errors.push('Move-in date must be a valid date');
    }
  }

  if (data.durationMonths && (typeof data.durationMonths !== 'number' || data.durationMonths < 1)) {
    errors.push('Duration must be at least 1 month');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
