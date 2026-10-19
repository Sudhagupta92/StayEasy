import { User } from '../models/User.js';
import { OwnerProfile } from '../models/OwnerProfile.js';
import { Property } from '../models/Property.js';
import { ROLES, VERIFICATION_STATUS } from '../constants/roles.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * @desc    Get administrative metrics & verification queue
 * @route   GET /api/v1/admin/overview
 * @access  Private (ADMIN only)
 */
export const getAdminOverview = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTenants = await User.countDocuments({ role: ROLES.USER });
    const totalOwners = await User.countDocuments({ role: ROLES.OWNER });
    const pendingOwners = await OwnerProfile.countDocuments({
      verificationStatus: VERIFICATION_STATUS.PENDING,
    });
    const totalProperties = await Property.countDocuments();

    return successResponse(res, 'Admin overview metrics retrieved', {
      systemStats: {
        totalUsers,
        totalTenants,
        totalOwners,
        pendingOwnerVerifications: pendingOwners,
        totalProperties,
        platformStatus: 'Operational',
        currentPhase: 'Phase 2 - Authentication & Roles',
      },
    });
  } catch (error) {
    next(error);
  }
};
