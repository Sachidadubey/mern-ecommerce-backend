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
    req.params.productId // ✅ FIX
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
    req.params.productId, // ✅ FIX
    req.body,
    req.user._id,
    req.files // ✅ IMPORTANT
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
  const product=await productService.deleteProductService(
    req.params.productId, // ✅ FIX
    req.user._id
  );

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
    product
  });
});


// best seller
exports.getBestSellers = asyncHandler(async (req, res) => {
  const products = await productService.getBestSellersService();
  
  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
  });
});
// top rated products
exports.getTopRatedProducts = asyncHandler(async (req, res) => {
  const products = await productService.getTopRatedProductsService(); 
  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
  });
});

// recommended products
exports.getRecommendedProducts = asyncHandler(async (req, res) => {
  const products = await productService.getRecommendedProductsService(req.params.productId); 
  res.status(200).json({
    success: true,
    count: products.length,
    data: products,
  });
});
