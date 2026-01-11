const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const validateObjectId = require("../middlewares/validateObjectId.middleware");

const validate = require("../middlewares/validate.middleware");
const { createProductSchema } = require("../validations/product.schema");

const {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getSingleProduct,
} = require("../controllers/product.controller");

/* ================= ADMIN ROUTES ================= */

// Create product
router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  validate(createProductSchema),
  createProduct
);

// Update product
router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  validateObjectId,
  updateProduct
);

// Delete product (soft delete)
router.delete(
  "/:id",
  protect,
  authorizeRoles("admin"),
  validateObjectId,
  deleteProduct
);

/* ================= PUBLIC ROUTES ================= */

// Get all active products
router.get("/", getAllProducts);

// Get single product
router.get("/:id", validateObjectId, getSingleProduct);

module.exports = router;
