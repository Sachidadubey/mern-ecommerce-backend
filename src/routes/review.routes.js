const express = require("express");
const router = express.Router();

const {
  addOrUpdateReview,
  getProductReviews,
  getMyReviewForProduct,
  deleteReview,
  getAllReviewsAdmin,
} = require("../controllers/review.controller");

const { protect } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const { validateObjectId } = require("../middlewares/validateObjectId.middleware");

/**
 * =========================
 * USER ROUTES
 * =========================
 */

// Add or update review
// POST /api/v1/reviews
router.post("/", protect, addOrUpdateReview);

// Get MY review for a product (for edit UI)
// GET /api/v1/reviews/my/:productId
router.get(
  "/my/:productId",
  protect,
  validateObjectId,
  getMyReviewForProduct
);

// Delete review (OWNER or ADMIN)
// DELETE /api/v1/reviews/:reviewId
router.delete(
  "/:reviewId",
  protect,
  validateObjectId,
  deleteReview
);

/**
 * =========================
 * PUBLIC ROUTES
 * =========================
 */

// Get reviews for a product
// GET /api/v1/reviews/product/:productId
router.get(
  "/product/:productId",
  validateObjectId,
  getProductReviews
);

/**
 * =========================
 * ADMIN ROUTES
 * =========================
 */

// Get all reviews (ADMIN)
// GET /api/v1/reviews/admin/all
router.get(
  "/admin/all",
  protect,
  authorizeRoles("Admin"),
  getAllReviewsAdmin
);

module.exports = router;
