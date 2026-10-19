import { OwnerProfile } from '../models/OwnerProfile.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * @desc    Get current owner profile
 * @route   GET /api/v1/owners/profile
 * @access  Private (OWNER)
 */
export const getOwnerProfile = async (req, res, next) => {
  try {
    let profile = await OwnerProfile.findOne({ userId: req.user._id });

    if (!profile) {
      // Auto-create if not yet initialized
      profile = await OwnerProfile.create({
        userId: req.user._id,
        businessName: `${req.user.name}'s Properties`,
      });
    }

    return successResponse(res, 'Owner profile retrieved', { ownerProfile: profile });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update owner profile (business name, govt ID, address)
 * @route   PUT /api/v1/owners/profile
 * @access  Private (OWNER)
 */
export const updateOwnerProfile = async (req, res, next) => {
  try {
    const {
      businessName,
      govtIdType,
      govtIdNumber,
      emergencyContact,
      address,
    } = req.body;

    let profile = await OwnerProfile.findOne({ userId: req.user._id });

    if (!profile) {
      profile = new OwnerProfile({ userId: req.user._id });
    }

    if (businessName) profile.businessName = businessName.trim();
    if (govtIdType) profile.govtIdType = govtIdType;
    if (govtIdNumber) profile.govtIdNumber = govtIdNumber.trim();
    if (emergencyContact) profile.emergencyContact = emergencyContact.trim();
    if (address && typeof address === 'object') {
      profile.address = {
        ...profile.address,
        ...address,
      };
    }

    await profile.save();

    return successResponse(res, 'Owner profile updated successfully', {
      ownerProfile: profile,
    });
  } catch (error) {
    next(error);
  }
};
