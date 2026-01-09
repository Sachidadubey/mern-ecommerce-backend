const express = require("express");
const router = express.Router();

const {
  addToWishlist,
  removeFromWishlist,
  getMyWishlist,
} = require("../controllers/wishlist.controller");

const { protect } = require("../middlewares/auth.middleware");
const { validateObjectId } = require("../middlewares/validateObjectId.middleware");

// Add to wishlist
// POST /api/v1/wishlist/:productId
router.post(
  "/:productId",
  protect,
  validateObjectId,
  addToWishlist
);

// Remove from wishlist
// DELETE /api/v1/wishlist/:productId
router.delete(
  "/:productId",
  protect,
  validateObjectId,
  removeFromWishlist
);

// Get my wishlist
// GET /api/v1/wishlist
router.get(
  "/",
  protect,
  getMyWishlist
);

module.exports = router;
