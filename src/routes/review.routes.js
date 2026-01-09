const express = require("express");
const router = express.Router();

const {
  addOrUpdateReview,
  getProductReviews,
  deleteReview,
} = require("../controllers/review.controller");

const { protect } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../midllewares/role.middleware");
const { validateObjectId } = require("../middlewares/validateObjectId.middleware");
// USER
router.post("/", protect, addOrUpdateReview);

// PUBLIC
router.get("/:productId",validateObjectId, getProductReviews);

// USER / ADMIN
router.delete("/:id", protect,validateObjectId,authorizeRoles("Admin"), deleteReview);

module.exports = router;
