import { User } from '../models/User.js';
import { OwnerProfile } from '../models/OwnerProfile.js';
import { generateToken } from '../utils/jwt.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { validateRegisterInput, validateLoginInput } from '../validators/auth.validator.js';
import { ROLES } from '../constants/roles.js';

/**
 * @desc    Register a new user (USER or OWNER)
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
  try {
    const { isValid, errors, sanitized } = validateRegisterInput(req.body);

    if (!isValid) {
      return errorResponse(res, 'Validation failed', 400, errors);
    }

    const { name, email, password, role, phone, businessName } = sanitized;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 'Account already exists. Please login.', 400);
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || ROLES.USER,
      phone: phone || '',
    });

    // If role is OWNER, create linked OwnerProfile with atomic rollback
    let ownerProfile = null;
    if (user.role === ROLES.OWNER) {
      try {
        ownerProfile = await OwnerProfile.create({
          userId: user._id,
          businessName: businessName || `${user.name}'s Properties`,
        });
      } catch (profileError) {
        // Rollback user creation if OwnerProfile fails
        await User.findByIdAndDelete(user._id);
        throw profileError;
      }
    }

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    return successResponse(
      res,
      'Registration successful',
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          isVerified: user.isVerified,
          avatar: user.avatar,
          occupation: user.occupation || '',
          bio: user.bio || '',
          createdAt: user.createdAt,
          ...(ownerProfile && { ownerProfile }),
        },
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get JWT token
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { isValid, errors, sanitized } = validateLoginInput(req.body);

    if (!isValid) {
      return errorResponse(res, 'Validation failed', 400, errors);
    }

    const { email, password } = sanitized;

    // Check for user and include password field for matching
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    // If OWNER, fetch owner profile
    let ownerProfile = null;
    if (user.role === ROLES.OWNER) {
      ownerProfile = await OwnerProfile.findOne({ userId: user._id });
    }

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    return successResponse(
      res,
      'Login successful',
      {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          isVerified: user.isVerified,
          avatar: user.avatar,
          occupation: user.occupation,
          bio: user.bio,
          ...(ownerProfile && { ownerProfile }),
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current authenticated user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    let ownerProfile = null;
    if (req.user.role === ROLES.OWNER) {
      ownerProfile = await OwnerProfile.findOne({ userId: req.user._id });
    }

    return successResponse(
      res,
      'User profile fetched successfully',
      {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          phone: req.user.phone,
          isVerified: req.user.isVerified,
          avatar: req.user.avatar,
          occupation: req.user.occupation,
          bio: req.user.bio,
          createdAt: req.user.createdAt,
          ...(ownerProfile && { ownerProfile }),
        },
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log user out (Client clears token)
 * @route   POST /api/v1/auth/logout
 * @access  Private
 */
export const logout = (req, res) => {
  return successResponse(res, 'Logged out successfully', null, 200);
};
