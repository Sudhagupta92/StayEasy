import mongoose from 'mongoose';

export const validateCreateReviewInput = (data) => {
  const errors = [];

  const { propertyId, title, comment, overallRating } = data;

  if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
    errors.push('A valid Property ID is required');
  }

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('Review title is required');
  } else if (title.trim().length > 120) {
    errors.push('Title cannot exceed 120 characters');
  }

  if (!comment || typeof comment !== 'string' || comment.trim().length < 10) {
    errors.push('Comment must be at least 10 characters long');
  } else if (comment.trim().length > 2000) {
    errors.push('Comment cannot exceed 2000 characters');
  }

  if (typeof overallRating !== 'number' || overallRating < 1 || overallRating > 5) {
    errors.push('Overall rating must be a number between 1 and 5');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateOwnerResponseInput = (data) => {
  const errors = [];
  const { responseText } = data;

  if (!responseText || typeof responseText !== 'string' || responseText.trim().length === 0) {
    errors.push('Response text is required');
  } else if (responseText.trim().length > 1000) {
    errors.push('Response text cannot exceed 1000 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateFlagInput = (data) => {
  const errors = [];
  const { reason } = data;

  if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
    errors.push('Reason for flagging is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
