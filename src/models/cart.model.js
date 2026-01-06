const mongoose = require("mongoose");
const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "product",
    required: [true, "product is required.."],
  },
  quantity: {
    type: Number,
    required: [true, "name is required"],
    min: [1, "Quantity Must be at least 1"],
  },
  price: {
    type: Number,
    required: [true, "price is required"],
  },
}, { _id: false });

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "user required"],
    unique: [true, "duplicate user"],
  },
  items: [cartItemSchema],
  totalPrice: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });
module.exports = mongoose.model("cart", cartSchema);