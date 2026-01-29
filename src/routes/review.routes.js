const express = require("express");
const router = express.Router();

const {
  addOrUpdateReview,
  getProductReviews,
  getMyReviewForProduct,
  deleteReview,
  getAllReviewsAdmin,
  approveReview,
  rejectReview,
  getPendingReviewsService,
} = require("../controllers/review.controller");

const { protect } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const validateObjectId = require("../middlewares/validateObjectId.middleware");
const validate = require("../middlewares/validate.middleware");

const {
  createOrUpdateReviewSchema,
  getProductReviewsSchema,
  getMyReviewForProductSchema,
  deleteReviewSchema,
  getAllReviewsAdminSchema,

} = require("../validations/review.schema");

/**
 * =========================
 * USER ROUTES (SPECIFIC FIRST)
 * =========================
 */

// 🔥 My review for product (FIRST)
router.get(
  "/product/:productId/me",
  protect,
  validateObjectId(),
  validate(getMyReviewForProductSchema),
  getMyReviewForProduct
);

// 🔥 Add / update review
router.post(
  "/product/:productId",
  protect,
  validateObjectId(),
  validate(createOrUpdateReviewSchema),
  addOrUpdateReview
);

/**
 * =========================
 * PUBLIC ROUTES
 * =========================
 */

// 🔥 Public product reviews (AFTER)
router.get(
  "/product/:productId",
  validateObjectId(),
  validate(getProductReviewsSchema),
  getProductReviews
);

/**
 * =========================
 * USER / ADMIN ROUTES
 * =========================
 */

// Delete review
router.delete(
  "/:reviewId",
  protect,
  validateObjectId(),
  validate(deleteReviewSchema),
  deleteReview
);

/**
 * =========================
 * ADMIN ROUTES
 * =========================
 */

router.get(
  "/",
  protect,
  authorizeRoles("admin"),
  validate(getAllReviewsAdminSchema),
  getAllReviewsAdmin
);
router.get(
  "/pending",
  protect,
  authorizeRoles("admin"),
  getPendingReviewsService
);

router.patch(
  "/:reviewId/approve",
  protect,
  authorizeRoles("admin"),
  validateObjectId(),
  approveReview
);

router.patch(
  "/:reviewId/reject",
  protect,
  authorizeRoles("admin"),
  validateObjectId(),
  rejectReview
);


module.exports = router;
