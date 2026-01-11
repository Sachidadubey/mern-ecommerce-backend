const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const AppError = require("../utils/AppError");

/**
 * ADD ITEM TO CART
 */
exports.addToCartService = async (userId, productId, quantity) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  if (product.stock < quantity) {
    throw new AppError("Insufficient stock", 400);
  }

  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: [
        {
          product: productId,
          quantity,
          price: product.price,
        },
      ],
      totalPrice: product.price * quantity,
    });

    return cart;
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (itemIndex > -1) {
    cart.items[itemIndex].quantity += quantity;
  } else {
    cart.items.push({
      product: productId,
      quantity,
      price: product.price,
    });
  }

  cart.totalPrice = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  await cart.save();
  return cart;
};

/**
 * GET MY CART
 */
exports.getMyCartService = async (userId) => {
  return Cart.findOne({ user: userId }).populate(
    "items.product",
    "name price images"
  );
};

/**
 * UPDATE CART ITEM QUANTITY
 */
exports.updateCartItemService = async (userId, productId, quantity) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  const item = cart.items.find(
    (i) => i.product.toString() === productId
  );

  if (!item) {
    throw new AppError("Item not found in cart", 404);
  }

  const product = await Product.findById(productId);
  if (!product || product.stock < quantity) {
    throw new AppError("Insufficient stock", 400);
  }

  item.quantity = quantity;

  cart.totalPrice = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  await cart.save();
  return cart;
};

/**
 * REMOVE ITEM FROM CART
 */
exports.removeCartItemService = async (userId, productId) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  const initialLength = cart.items.length;

  cart.items = cart.items.filter(
    (item) => item.product.toString() !== productId
  );

  if (cart.items.length === initialLength) {
    throw new AppError("Item not found in cart", 404);
  }

  cart.totalPrice = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  await cart.save();
  return cart;
};

/**
 * CLEAR CART
 */
exports.clearCartService = async (userId) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) {
    throw new AppError("Cart not found", 404);
  }

  cart.items = [];
  cart.totalPrice = 0;
  await cart.save();
};
