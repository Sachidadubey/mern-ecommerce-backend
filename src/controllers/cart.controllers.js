const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

/**
 * ======================================================
 * ADD ITEM TO CART
 * POST /api/cart
 * ======================================================
 */
exports.addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  // 1️⃣ Basic validations (Bad Request)
  if (!productId) {
    throw new AppError("Product ID is required", 400);
  }

  if (!quantity || quantity < 1) {
    throw new AppError("Quantity must be greater than 0", 400);
  }

  // 2️⃣ Check product existence
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // 3️⃣ Stock validation
  if (product.stock < quantity) {
    throw new AppError("Insufficient stock", 400);
  }

  // 4️⃣ Find user's cart
  // IMPORTANT: use `let` because cart may be reassigned
  let cart = await Cart.findOne({ user: req.user._id });

  // 5️⃣ If cart does NOT exist → create new cart
  if (!cart) {
    cart = await Cart.create({
      user: req.user._id,
      items: [
        {
          product: productId,
          quantity,
          price: product.price, // snapshot price
        },
      ],
      totalPrice: product.price * quantity,
    });
  } else {
    // 6️⃣ Cart exists → check if product already present

    // findIndex returns:
    // >= 0  → product exists
    // -1    → product not in cart
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      // 7️⃣ Product already in cart → increment quantity
      cart.items[itemIndex].quantity += quantity;
    } else {
      // 8️⃣ Product not in cart → push new item
      cart.items.push({
        product: productId,
        quantity,
        price: product.price,
      });
    }

    // 9️⃣ Recalculate totalPrice (ALWAYS recompute, never increment blindly)
    cart.totalPrice = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    await cart.save();
  }

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
  const cart = await Cart.findOne({ user: req.user._id })
    .populate("items.product", "name price images");

  // If cart does not exist OR empty
  if (!cart || cart.items.length === 0) {
    return res.status(200).json({
      success: true,
      message: "Cart is empty",
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

      // totalItems ≠ items.length
      // totalItems = sum of quantities
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
  const { productId } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    throw new AppError("Quantity must be at least 1", 400);
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  // find returns the actual object (not index)
  const item = cart.items.find(
    (item) => item.product.toString() === productId
  );

  if (!item) {
    throw new AppError("Item not found in cart", 404);
  }

  // Optional but recommended: re-check stock
  const product = await Product.findById(productId);
  if (!product || product.stock < quantity) {
    throw new AppError("Insufficient stock", 400);
  }

  // Update quantity
  item.quantity = quantity;

  // Recalculate total price safely
  cart.totalPrice = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  await cart.save();

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
  const { productId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  const initialLength = cart.items.length;

  // IMPORTANT:
  // Keep all items EXCEPT the one to be removed
  cart.items = cart.items.filter(
    (item) => item.product.toString() !== productId
  );

  if (cart.items.length === initialLength) {
    throw new AppError("Item not found in cart", 404);
  }

  // Recalculate total price
  cart.totalPrice = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  await cart.save();

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
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  cart.items = [];
  cart.totalPrice = 0;

  await cart.save();

  res.status(200).json({
    success: true,
    message: "Cart cleared successfully",
  });
});
