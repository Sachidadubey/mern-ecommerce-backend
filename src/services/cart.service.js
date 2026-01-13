const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const AppError = require("../utils/AppError");

/* =========================
   HELPER: RECALCULATE CART
========================= */
const recalcCart = async (cart) => {
  cart.totalPrice = cart.items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  if (cart.items.length === 0) {
    await Cart.deleteOne({ _id: cart._id });
    return null;
  }

  await cart.save();
  return cart;
};

/* =========================
   ADD ITEM TO CART
========================= */
exports.addToCartService = async (userId, productId, quantity = 1) => {
  if (quantity < 1) {
    throw new AppError("Quantity must be at least 1", 400);
  }

  const product = await Product.findOne({
    _id: productId,
    isActive: true,
  });

  if (!product) {
    throw new AppError("Product not found or inactive", 404);
  }

  if (product.stock < 1) {
    throw new AppError("Product is out of stock", 400);
  }

  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [], totalPrice: 0 });
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (itemIndex > -1) {
    const newQty = cart.items[itemIndex].quantity + quantity;
    cart.items[itemIndex].quantity = Math.min(newQty, product.stock);
    cart.items[itemIndex].price = product.price;
  } else {
    cart.items.push({
      product: productId,
      quantity: Math.min(quantity, product.stock),
      price: product.price,
    });
  }

  return await recalcCart(cart);
};

/* =========================
   GET MY CART
========================= */
exports.getMyCartService = async (userId) => {
  const cart = await Cart.findOne({ user: userId })
    .populate("items.product", "name price stock isActive");

  if (!cart) return { items: [], totalPrice: 0 };

  cart.items = cart.items.filter(
    (item) => item.product && item.product.isActive && item.product.stock > 0
  );

  cart.items.forEach((item) => {
    item.quantity = Math.min(item.quantity, item.product.stock);
    item.price = item.product.price;
  });

  const updatedCart = await recalcCart(cart);
  return updatedCart || { items: [], totalPrice: 0 };
};

/* =========================
   UPDATE CART ITEM
========================= */
exports.updateCartItemService = async (userId, productId, quantity) => {
  if (quantity < 1) {
    throw new AppError("Quantity must be at least 1", 400);
  }

  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new AppError("Cart not found", 404);

  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );
  if (itemIndex === -1) {
    throw new AppError("Product not in cart", 404);
  }

  const product = await Product.findOne({
    _id: productId,
    isActive: true,
  });

  if (!product || product.stock < 1) {
    throw new AppError("Product not available", 404);
  }

  cart.items[itemIndex].quantity = Math.min(quantity, product.stock);
  cart.items[itemIndex].price = product.price;

  return await recalcCart(cart);
};

/* =========================
   REMOVE ITEM FROM CART
========================= */
exports.removeCartItemService = async (userId, productId) => {
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw new AppError("Cart not found", 404);

  cart.items = cart.items.filter(
    (item) => item.product.toString() !== productId
  );

  const updatedCart = await recalcCart(cart);
  return updatedCart || { items: [], totalPrice: 0 };
};

/* =========================
   CLEAR CART
========================= */
exports.clearCartService = async (userId) => {
  await Cart.deleteOne({ user: userId });
};
