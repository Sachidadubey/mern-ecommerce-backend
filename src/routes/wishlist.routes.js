const express = require("express");
const router = express.Router();

const {
  addToWishlist,
  removeFromWishlist,
  getMyWishlist,
  clearWishlist,
} = require("../controllers/wishlist.controller");

const { protect } = require("../middlewares/auth.middleware");
const validateObjectId = require("../middlewares/validateObjectId.middleware");

/**
 * =========================
 * USER ROUTES
 * =========================
 */

router.use(protect);

// clear wishlist 
router.delete("/clear", clearWishlist);

// Add to wishlist
router.post(
  "/:productId",
  validateObjectId(),
  addToWishlist
);

// Remove from wishlist
router.delete(
  "/:productId",
  validateObjectId(),
  removeFromWishlist
);

// Get my wishlist
router.get("/", getMyWishlist);



module.exports = router;
