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
const validateObjectId = require("../middlewares/validateObjectId.middleware");
const validate = require("../middlewares/validate.middleware");
const { createReviewSchema } = require("../validations/review.schema");

/**
 * =========================
 * PUBLIC ROUTES
 * =========================
 */

// Get reviews for a product (paginated)
router.get(
  "/product/:productId",
  validateObjectId,
  getProductReviews
);

/**
 * =========================
 * USER ROUTES
 * =========================
 */

// Add or update review
router.post(
  "/",
  protect,
  validate(createReviewSchema),
  addOrUpdateReview
);

// Get my review for a product
router.get(
  "/product/:productId/me",
  protect,
  validateObjectId,
  getMyReviewForProduct
);

// Delete review (owner or admin)
router.delete(
  "/:reviewId",
  protect,
  validateObjectId,
  deleteReview
);

/**
 * =========================
 * ADMIN ROUTES
 * =========================
 */

// Get all reviews (admin moderation)
router.get(
  "/admin",
  protect,
  authorizeRoles("admin"),
  getAllReviewsAdmin
);

module.exports = router;
