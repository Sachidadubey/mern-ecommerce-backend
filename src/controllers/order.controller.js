const Order = require("../models/order.model");
const Cart = require("../models/cart.model");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");


exports.createOrder = asyncHandler(async (req, res) => {
  const { address } = req.body;
  if (!address) {
    throw new AppError("Address  not found", 400);
  }
  // fetch users cart----
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length==0)
  {
    throw new AppError("Cart is Empty");
  }
  // convert cart-> order item 
  const orderItems = cart.items.map((item) => ({
    product: item.product._id,
    name: item.product.name,
    price: item.price,
    quantity:item.quantity,
  }));
  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    totalAmount: cart.totalPrice,
    address,

  });

  // clear cart after order creation ---

  cart.items = [];
  cart.totalPrice = 0;
  await cart.save();

  res.status(201).json({
    success: true,
    message: "order created successfully",
    data: order,
  });

});

