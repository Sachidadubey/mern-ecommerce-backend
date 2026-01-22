const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const validateObjectId = require("../middlewares/validateObjectId.middleware");

const userController = require("../controllers/user.controller");

/**
 * =========================
 * USER ROUTES
 * =========================
 */

router.use(protect);

// Get profile
router.get("/profile", userController.getProfile);

// Update profile
router.put("/profile", userController.updateProfile);

// Add address
router.post("/addresses", userController.addAddress);

// Update address
router.put("/addresses/:index", userController.updateAddress);

// Delete address
router.delete("/addresses/:index", userController.deleteAddress);

// Set default address
router.patch("/addresses/:index/default", userController.setDefaultAddress);

// Get user stats
router.get("/stats", userController.getUserStats);

/**
 * =========================
 * ADMIN ROUTES
 * =========================
 */

router.use(authorizeRoles("admin"));

// Get all users
router.get("/", userController.getAllUsers);

// Update user role
router.patch(
  "/:id/role",
  validateObjectId,
  userController.updateUserRole
);

// Block user
router.patch("/:id/block", validateObjectId, userController.blockUser);

// Unblock user
router.patch("/:id/unblock", validateObjectId, userController.unblockUser);

module.exports = router;
