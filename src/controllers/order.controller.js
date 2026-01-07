exports.createOrder = asyncHandler(async (req, res) => {
  const { address } = req.body;

  if (!address) {
    throw new AppError("Delivery address is required", 400);
  }

  // 1️⃣ Fetch user's cart WITH product data
  const cart = await Cart.findOne({ user: req.user._id })
    .populate("items.product", "name");

  if (!cart || cart.items.length === 0) {
    throw new AppError("Cart is empty", 400);
  }

  // 2️⃣ Convert cart → order items (SNAPSHOT)
  const orderItems = cart.items.map((item) => ({
    product: item.product._id,   // ObjectId
    name: item.product.name,     // snapshot
    price: item.price,           // snapshot
    quantity: item.quantity,
  }));

  // 3️⃣ Create order
  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    totalAmount: cart.totalPrice,
    address,
  });

  // 4️⃣ Clear cart AFTER order creation
  cart.items = [];
  cart.totalPrice = 0;
  await cart.save();

  res.status(201).json({
    success: true,
    message: "Order created successfully",
    data: order,
  });
});
