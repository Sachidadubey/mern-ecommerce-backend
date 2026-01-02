const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
 userId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  required: true
},
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Number,
    default:Date.now()+10*60*1000 // 10 min 
  },
  isVerified: {
    type: Boolean,
    default: false
  }
},
  { timestamps: true }
);
module.exports = mongoose.model("otp", otpSchema);