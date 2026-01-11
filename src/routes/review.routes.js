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

// Get MY review for a product
router.get(
  "/my/:productId",
  protect,
  validateObjectId,
  getMyReviewForProduct
);

// Delete review (OWNER or ADMIN)
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
router.get(
  "/admin/all",
  protect,
  authorizeRoles("Admin"),
  getAllReviewsAdmin
);

module.exports = router;
