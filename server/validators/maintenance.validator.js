import mongoose from 'mongoose';
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from '../constants/roles.js';

/**
 * Validate ticket creation input
 */
export const validateCreateTicketInput = (data = {}) => {
  const errors = [];

  const { propertyId, bookingId, category, title, description, priority, attachments } = data;

  if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
    errors.push('A valid Property ID is required');
  }

  if (bookingId && !mongoose.Types.ObjectId.isValid(bookingId)) {
    errors.push('A valid Booking ID is required');
  }

  if (!category || !Object.values(TICKET_CATEGORIES).includes(category)) {
    errors.push(
      `Valid category is required (${Object.values(TICKET_CATEGORIES).join(', ')})`
    );
  }

  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    errors.push('Ticket title is required (minimum 3 characters)');
  } else if (title.trim().length > 100) {
    errors.push('Ticket title cannot exceed 100 characters');
  }

  if (!description || typeof description !== 'string' || description.trim().length < 10) {
    errors.push('Ticket description is required (minimum 10 characters)');
  } else if (description.trim().length > 2000) {
    errors.push('Ticket description cannot exceed 2000 characters');
  }

  if (priority && !Object.values(TICKET_PRIORITIES).includes(priority)) {
    errors.push(
      `Invalid priority level. Allowed: ${Object.values(TICKET_PRIORITIES).join(', ')}`
    );
  }

  if (attachments && !Array.isArray(attachments)) {
    errors.push('Attachments must be an array of image URLs');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate owner acknowledge input
 */
export const validateAcknowledgeInput = (data = {}) => {
  const errors = [];
  const { ownerResponse } = data;

  if (ownerResponse && typeof ownerResponse === 'string' && ownerResponse.trim().length > 1000) {
    errors.push('Owner response cannot exceed 1000 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate start work input
 */
export const validateStartTicketInput = (data = {}) => {
  const errors = [];
  const { assignedTo, notes } = data;

  if (assignedTo && typeof assignedTo === 'string' && assignedTo.trim().length > 100) {
    errors.push('Assigned personnel name/contact cannot exceed 100 characters');
  }

  if (notes && typeof notes === 'string' && notes.trim().length > 1000) {
    errors.push('Action notes cannot exceed 1000 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate resolve ticket input
 */
export const validateResolveTicketInput = (data = {}) => {
  const errors = [];
  const { resolutionNotes } = data;

  if (!resolutionNotes || typeof resolutionNotes !== 'string' || resolutionNotes.trim().length < 5) {
    errors.push('Resolution notes are required (minimum 5 characters)');
  } else if (resolutionNotes.trim().length > 2000) {
    errors.push('Resolution notes cannot exceed 2000 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate reopen ticket input
 */
export const validateReopenTicketInput = (data = {}) => {
  const errors = [];
  const { reason } = data;

  if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
    errors.push('Reason for reopening ticket is required (minimum 5 characters)');
  } else if (reason.trim().length > 1000) {
    errors.push('Reopen reason cannot exceed 1000 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
