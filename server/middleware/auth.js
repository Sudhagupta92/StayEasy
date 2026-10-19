import { verifyToken } from '../utils/jwt.js';
import { User } from '../models/User.js';
import { errorResponse } from '../utils/apiResponse.js';

/**
 * Protect routes - Verifies JWT Bearer token and attaches authenticated user to req.user
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      if (!token) {
        return errorResponse(res, 'Not authorized, token missing', 401);
      }

      // Verify token
      const decoded = verifyToken(token);

      // Attach user to request (excluding password)
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return errorResponse(res, 'The user belonging to this token no longer exists', 401);
      }

      req.user = user;
      return next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return errorResponse(res, 'Session expired, please log in again', 401);
      }
      return errorResponse(res, 'Not authorized, invalid token', 401);
    }
  }

  if (!token) {
    return errorResponse(res, 'Not authorized, authentication token required', 401);
  }
};

/**
 * Role-Based Access Control (RBAC) middleware
 * Restricts route access to specific roles (e.g. 'ADMIN', 'OWNER', 'USER')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required before checking permissions', 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `User role '${req.user.role}' is not authorized to access this resource`,
        403
      );
    }

    next();
  };
};
