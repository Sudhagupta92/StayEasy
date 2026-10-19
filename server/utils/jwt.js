import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

/**
 * Generate a signed JWT token
 * @param {string} userId - User's MongoDB _id
 * @param {string} role - User's role (USER, OWNER, ADMIN)
 * @returns {string} Signed JWT token
 */
export const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    ENV.JWT_SECRET,
    { expiresIn: ENV.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Verify and decode a JWT token
 * @param {string} token - JWT token string
 * @returns {object} Decoded token payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, ENV.JWT_SECRET);
};
