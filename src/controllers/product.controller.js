const asyncHandler = require("../utils/asyncHandler");
const productService = require("../services/product.service");

/**
 * =========================
 * CREATE PRODUCT (ADMIN)
 * =========================
 */
exports.createProduct = asyncHandler(async (req, res) => {
  const product = await productService.addProductService(
    req.body,
    req.user._id,
    req.files
  );

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: product,
  });
});

/**
 * =========================
 * GET ALL PRODUCTS
 * (PUBLIC / ADMIN)
 * =========================
 */
exports.getAllProducts = asyncHandler(async (req, res) => {
  const { products, meta } =
    await productService.getAllProductsService(req.query);

  res.status(200).json({
    success: true,
    data: products,
    pagination: meta,
  });
});

/**
 * =========================
 * GET SINGLE PRODUCT
 * =========================
 */
exports.getSingleProduct = asyncHandler(async (req, res) => {
  const product = await productService.getSingleProductService(
    req.params.id
  );

  res.status(200).json({
    success: true,
    data: product,
  });
});

/**
 * =========================
 * UPDATE PRODUCT (ADMIN)
 * =========================
 */
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProductService(
    req.params.id,
    req.body,
    req.user._id
  );

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    data: product,
  });
});

/**
 * =========================
 * DELETE PRODUCT (SOFT DELETE – ADMIN)
 * =========================
 */
exports.deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProductService(
    req.params.id,
    req.user._id
  );

  res.status(204).json({
    success: true,
  });
});
