const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  enail: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  isVarified: {
    type: Boolean,
    default: false
  }
},
  { timestamps: true }
);
module.exports = mongoose.model("otp", otpSchema);