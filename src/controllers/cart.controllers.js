const asyncHandler = require("../utils/asyncHandler");
const cartService = require("../services/cart.service");

/**
 * ======================================================
 * ADD ITEM TO CART
 * POST /api/cart
 * ======================================================
 */
exports.addToCart = asyncHandler(async (req, res) => {
  const cart = await cartService.addToCartService(
    req.user._id,
    req.body.productId,
    req.body.quantity
  );

  res.status(200).json({
    success: true,
    message: "Item added to cart",
    data: cart,
  });
});

/**
 * ======================================================
 * GET MY CART
 * GET /api/cart
 * ======================================================
 */
exports.getMyCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getMyCartService(req.user._id);

  if (!cart || cart.items.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        items: [],
        totalItems: 0,
        totalPrice: 0,
      },
    });
  }

  res.status(200).json({
    success: true,
    data: {
      items: cart.items,
      totalItems: cart.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      ),
      totalPrice: cart.totalPrice,
    },
  });
});

/**
 * ======================================================
 * UPDATE CART ITEM QUANTITY
 * PUT /api/cart/item/:productId
 * ======================================================
 */
exports.updateCartItem = asyncHandler(async (req, res) => {
  const cart = await cartService.updateCartItemService(
    req.user._id,
    req.params.productId,
    req.body.quantity
  );

  res.status(200).json({
    success: true,
    message: "Cart item updated",
    data: cart,
  });
});

/**
 * ======================================================
 * REMOVE ITEM FROM CART
 * DELETE /api/cart/item/:productId
 * ======================================================
 */
exports.removeCartItem = asyncHandler(async (req, res) => {
  const cart = await cartService.removeCartItemService(
    req.user._id,
    req.params.productId
  );

  res.status(200).json({
    success: true,
    message: "Item removed from cart",
    data: cart,
  });
});

/**
 * ======================================================
 * CLEAR CART
 * DELETE /api/cart
 * ======================================================
 */
exports.clearCart = asyncHandler(async (req, res) => {
  await cartService.clearCartService(req.user._id);

  res.status(200).json({
    success: true,
    message: "Cart cleared successfully",
  });
});
