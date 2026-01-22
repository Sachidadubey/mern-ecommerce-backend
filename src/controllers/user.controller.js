const asyncHandler = require("../utils/asyncHandler");
const userService = require("../services/user.service");

/**
 * GET USER PROFILE
 */
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getUserProfileService(req.user._id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * UPDATE USER PROFILE
 */
exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateUserProfileService(
    req.user._id,
    req.body
  );

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: user,
  });
});

/**
 * ADD ADDRESS
 */
exports.addAddress = asyncHandler(async (req, res) => {
  const addresses = await userService.addAddressService(
    req.user._id,
    req.body
  );

  res.status(201).json({
    success: true,
    message: "Address added successfully",
    data: addresses,
  });
});

/**
 * UPDATE ADDRESS
 */
exports.updateAddress = asyncHandler(async (req, res) => {
  const addresses = await userService.updateAddressService(
    req.user._id,
    req.params.index,
    req.body
  );

  res.status(200).json({
    success: true,
    message: "Address updated successfully",
    data: addresses,
  });
});

/**
 * DELETE ADDRESS
 */
exports.deleteAddress = asyncHandler(async (req, res) => {
  const addresses = await userService.deleteAddressService(
    req.user._id,
    req.params.index
  );

  res.status(200).json({
    success: true,
    message: "Address deleted successfully",
    data: addresses,
  });
});

/**
 * SET DEFAULT ADDRESS
 */
exports.setDefaultAddress = asyncHandler(async (req, res) => {
  const addresses = await userService.setDefaultAddressService(
    req.user._id,
    req.params.index
  );

  res.status(200).json({
    success: true,
    message: "Default address set successfully",
    data: addresses,
  });
});

/**
 * GET USER STATS
 */
exports.getUserStats = asyncHandler(async (req, res) => {
  const stats = await userService.getUserStatsService(req.user._id);

  res.status(200).json({
    success: true,
    data: stats,
  });
});

/* =============== ADMIN CONTROLLERS =============== */

/**
 * GET ALL USERS (Admin)
 */
exports.getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const result = await userService.getAllUsersService(req.query, page, limit);

  res.status(200).json({
    success: true,
    ...result,
  });
});

/**
 * UPDATE USER ROLE (Admin)
 */
exports.updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  const user = await userService.updateUserRoleService(
    req.params.id,
    role,
    req.user._id
  );

  res.status(200).json({
    success: true,
    message: "User role updated successfully",
    data: user,
  });
});

/**
 * BLOCK USER (Admin)
 */
exports.blockUser = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const user = await userService.blockUserService(
    req.params.id,
    reason,
    req.user._id
  );

  res.status(200).json({
    success: true,
    message: "User blocked successfully",
    data: user,
  });
});

/**
 * UNBLOCK USER (Admin)
 */
exports.unblockUser = asyncHandler(async (req, res) => {
  const user = await userService.unblockUserService(
    req.params.id,
    req.user._id
  );

  res.status(200).json({
    success: true,
    message: "User unblocked successfully",
    data: user,
  });
});
