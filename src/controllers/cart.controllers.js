const asyncHandler = require("../utils/asyncHandler");
const cartService = require("../services/cart.service");

/**
 * =========================
 * ADD PRODUCT TO CART
 * =========================
 */
exports.addToCart = asyncHandler(async (req, res) => {
  const cart = await cartService.addToCartService(req.user._id, req.body);

  res.status(200).json({
    success: true,
    message: "Product added/updated in cart",
    cart,
  });
});

/**
 * =========================
 * GET USER'S CART
 * =========================
 */
exports.getMyCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCartService(req.user._id);

  res.status(200).json({
    success: true,
    cart,
  });
});

/**
 * =========================
 * UPDATE CART ITEM QUANTITY
 * =========================
 */
exports.updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  const cart = await cartService.updateCartItemService(req.user._id, productId, quantity);

  res.status(200).json({
    success: true,
    message: "Cart item updated successfully",
    cart,
  });
});

/**
 * =========================
 * REMOVE PRODUCT FROM CART
 * =========================
 */
exports.removeCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const cart = await cartService.removeCartItemService(req.user._id, productId);

  res.status(200).json({
    success: true,
    message: "Product removed from cart",
    cart,
  });
});

/**
 * =========================
 * CLEAR ENTIRE CART
 * =========================
 */
exports.clearCart = asyncHandler(async (req, res) => {
  await cartService.clearCartService(req.user._id);

  res.status(200).json({
    success: true,
    message: "Cart cleared successfully",
  });
});