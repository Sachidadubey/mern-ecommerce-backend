const express = require("express");
const router = express.Router();

const {
  addToWishlist,
  removeFromWishlist,
  getMyWishlist,
} = require("../controllers/wishlist.controller");

const { protect } = require("../middlewares/auth.middleware");
const { authorizedRoles } = require("../middlewares/role.middleware");
const validateObjectId = require("../middlewares/validateObjectId");

/**
 * =========================
 * USER WISHLIST ROUTES
 * =========================
 * Wishlist is USER-SPECIFIC
 * Admin access is NOT required
 */

// GET my wishlist
router.get(
  "/",
  protect,
  authorizedRoles("user", "admin"),
  getMyWishlist
);

// ADD product to wishlist
router.post(
  "/:productId",
  protect,
  authorizedRoles("user", "admin"),
  validateObjectId("productId"),
  addToWishlist
);

// REMOVE product from wishlist
router.delete(
  "/:productId",
  protect,
  authorizedRoles("user", "admin"),
  validateObjectId("productId"),
  removeFromWishlist
);

module.exports = router;
