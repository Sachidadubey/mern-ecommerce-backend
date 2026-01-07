const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema({
  user:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"User",
    required: [true, "user required"],
    
  },
  items:
    [
     {
      product:
      {
       type: mongoose.Schema.Types.ObjectId,
       ref: "Product",
       required:[true,"Product is required"],
      },
      name: String,
      price: Number,
      quantity:Number,
    },
    ],
  totalAmount: {
    type: Number,
    required:[true,"TotalAmount is required"],
  },
  orderStatus: {
    type: String,
    enum: ["CREATED", "CONFIRMED", "DELIVERED", "CANCELLED"],
    default:"CREATED",
  },
  paymentStatus: {
    type: String,
    enum: ["PENDING", "PAID", "FAILED"],
    default:"PENDING",
  },
  address: {
    type: String,
    required:[true,"address required"],
  },

}, { timestamps: true });
module.exports = mongoose.model("Order", orderSchema);