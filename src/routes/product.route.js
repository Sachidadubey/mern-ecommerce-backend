const express = require("express");
const router = express.Router();

const { protect } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const validateObjectId = require("../middlewares/validateObjectId.middleware");
const validate = require("../middlewares/validate.middleware");

const productController = require("../controllers/product.controller");
const {
  createProductSchema,
  updateProductSchema,
} = require("../validations/product.schema");

const upload = require("../middlewares/upload.middleware");

/* ================= PUBLIC ROUTES ================= */

// Get all products
router.get("/", productController.getAllProducts);

// 🔥 STATIC ROUTES FIRST
router.get("/best-sellers", productController.getBestSellers);
router.get("/top-rated", productController.getTopRatedProducts);
router.get(
  "/recommended/:productId",
  validateObjectId(),
  productController.getRecommendedProducts
);

// 🔥 DYNAMIC ROUTE LAST
router.get(
  "/:productId",
  validateObjectId(),
  productController.getSingleProduct
);

/* ================= ADMIN ROUTES ================= */

router.use(protect);
router.use(authorizeRoles("admin"));

// Create product
router.post(
  "/",
  upload.array("images", 5),
  validate(createProductSchema),
  productController.createProduct
);

// Update product
router.put(
  "/:productId",
  validateObjectId(),
  upload.array("images", 5),
  validate(updateProductSchema),
  productController.updateProduct
);

// Delete product (soft delete)
router.delete(
  "/:productId",
  validateObjectId(),
  productController.deleteProduct
);

module.exports = router;
