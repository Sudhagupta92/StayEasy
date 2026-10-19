import { USER_ROLES, ROLES } from '../constants/roles.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates registration payload
 */
export const validateRegisterInput = (data) => {
  const errors = [];

  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  const password = typeof data.password === 'string' ? data.password : '';
  const role = typeof data.role === 'string' ? data.role.toUpperCase() : ROLES.USER;

  if (!name) {
    errors.push('Full name is required');
  } else if (name.length < 2 || name.length > 100) {
    errors.push('Name must be between 2 and 100 characters');
  }

  if (!email) {
    errors.push('Email address is required');
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push('Please provide a valid email address');
  }

  if (!password) {
    errors.push('Password is required');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (role && !USER_ROLES.includes(role)) {
    errors.push(`Invalid role. Allowed roles are: ${USER_ROLES.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      name,
      email,
      password,
      role: role || ROLES.USER,
      phone: typeof data.phone === 'string' ? data.phone.trim() : '',
      businessName: typeof data.businessName === 'string' ? data.businessName.trim() : '',
    },
  };
};

/**
 * Validates login payload
 */
export const validateLoginInput = (data) => {
  const errors = [];

  const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
  const password = typeof data.password === 'string' ? data.password : '';

  if (!email) {
    errors.push('Email address is required');
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push('Please provide a valid email address');
  }

  if (!password) {
    errors.push('Password is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      email,
      password,
    },
  };
};
