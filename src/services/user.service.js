const User = require("../models/User.model");
const AuditLog = require("../models/auditLog.model");
const AppError = require("../utils/AppError");

/**
 * GET USER PROFILE
 */
exports.getUserProfileService = async (userId) => {
  const user = await User.findById(userId)
    .select("-password -refreshToken -otp -otpExpire")
    .lean();

  if (!user) {
    throw new AppError("User not found", 404);
  }

  return user;
};

/**
 * UPDATE USER PROFILE
 */
exports.updateUserProfileService = async (userId, updateData) => {
  const allowedFields = [
    "name",
    "phone",
    "avatar",
    "preferences",
    "addresses",
  ];

  const filteredData = {};
  Object.keys(updateData).forEach((key) => {
    if (allowedFields.includes(key)) {
      filteredData[key] = updateData[key];
    }
  });

  const user = await User.findByIdAndUpdate(userId, filteredData, {
    new: true,
    runValidators: true,
  })
    .select("-password -refreshToken -otp")
    .lean();

  return user;
};

/**
 * ADD ADDRESS
 */
exports.addAddressService = async (userId, addressData) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // If first address, make it default
  if (!user.addresses || user.addresses.length === 0) {
    addressData.isDefault = true;
  }

  user.addresses.push(addressData);
  await user.save();

  return user.addresses;
};

/**
 * UPDATE ADDRESS
 */
exports.updateAddressService = async (userId, addressIndex, addressData) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!user.addresses[addressIndex]) {
    throw new AppError("Address not found", 404);
  }

  Object.assign(user.addresses[addressIndex], addressData);
  await user.save();

  return user.addresses;
};

/**
 * DELETE ADDRESS
 */
exports.deleteAddressService = async (userId, addressIndex) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!user.addresses[addressIndex]) {
    throw new AppError("Address not found", 404);
  }

  user.addresses.splice(addressIndex, 1);

  // If deleted address was default, set first as default
  if (
    user.addresses.length > 0 &&
    user.addresses.every((a) => !a.isDefault)
  ) {
    user.addresses[0].isDefault = true;
  }

  await user.save();

  return user.addresses;
};

/**
 * SET DEFAULT ADDRESS
 */
exports.setDefaultAddressService = async (userId, addressIndex) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!user.addresses[addressIndex]) {
    throw new AppError("Address not found", 404);
  }

  // Remove default from all
  user.addresses.forEach((addr) => (addr.isDefault = false));

  // Set selected as default
  user.addresses[addressIndex].isDefault = true;

  await user.save();

  return user.addresses;
};

/**
 * GET ALL USERS (Admin)
 */
exports.getAllUsersService = async (filters = {}, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const query = {};

  if (filters.role) query.role = filters.role;
  if (filters.isBlocked !== undefined) query.isBlocked = filters.isBlocked;
  if (filters.searchTerm) {
    query.$or = [
      { name: new RegExp(filters.searchTerm, "i") },
      { email: new RegExp(filters.searchTerm, "i") },
    ];
  }

  const users = await User.find(query)
    .select("-password -refreshToken -otp")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await User.countDocuments(query);

  return {
    users,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

/**
 * UPDATE USER ROLE (Admin)
 */
exports.updateUserRoleService = async (userId, newRole, adminId) => {
  if (!["user", "admin"].includes(newRole)) {
    throw new AppError("Invalid role", 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const oldRole = user.role;
  user.role = newRole;
  await user.save();

  // Log audit
  await AuditLog.create({
    action: "USER_ROLE_UPDATED",
    resource: "USER",
    resourceId: userId,
    userId: adminId,
    userRole: "admin",
    changes: { before: { role: oldRole }, after: { role: newRole } },
  });

  return user;
};

/**
 * BLOCK USER (Admin)
 */
exports.blockUserService = async (userId, reason, adminId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.isBlocked = true;
  user.blockReason = reason;
  user.blockedAt = new Date();
  await user.save();

  // Log audit
  await AuditLog.create({
    action: "USER_BLOCKED",
    resource: "USER",
    resourceId: userId,
    userId: adminId,
    userRole: "admin",
    changes: { after: { isBlocked: true, blockReason: reason } },
  });

  return user;
};

/**
 * UNBLOCK USER (Admin)
 */
exports.unblockUserService = async (userId, adminId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.isBlocked = false;
  user.blockReason = null;
  user.blockedAt = null;
  await user.save();

  // Log audit
  await AuditLog.create({
    action: "USER_UNBLOCKED",
    resource: "USER",
    resourceId: userId,
    userId: adminId,
    userRole: "admin",
    changes: { after: { isBlocked: false } },
  });

  return user;
};

/**
 * GET USER STATS
 */
exports.getUserStatsService = async (userId) => {
  const Order = require("../models/order.model");

  const stats = await Order.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSpent: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "PAID"] }, "$totalAmount", 0] },
        },
        completedOrders: {
          $sum: { $cond: [{ $eq: ["$orderStatus", "DELIVERED"] }, 1, 0] },
        },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ["$orderStatus", "CANCELLED"] }, 1, 0] },
        },
      },
    },
  ]);

  return stats[0] || { totalOrders: 0, totalSpent: 0, completedOrders: 0 };
};
