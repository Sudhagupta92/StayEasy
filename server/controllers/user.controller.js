import { User } from '../models/User.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * @desc    Get user profile
 * @route   GET /api/v1/users/profile
 * @access  Private (USER, OWNER, ADMIN)
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    return successResponse(res, 'Profile retrieved', { user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/v1/users/profile
 * @access  Private (USER, OWNER, ADMIN)
 */
export const updateUserProfile = async (req, res, next) => {
  try {
    const { name, phone, occupation, bio, avatar } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    if (name) user.name = name.trim();
    if (typeof phone === 'string') user.phone = phone.trim();
    if (typeof occupation === 'string') user.occupation = occupation.trim();
    if (typeof bio === 'string') user.bio = bio.trim();
    if (typeof avatar === 'string') user.avatar = avatar.trim();

    await user.save();

    return successResponse(res, 'Profile updated successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        occupation: user.occupation,
        bio: user.bio,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};
