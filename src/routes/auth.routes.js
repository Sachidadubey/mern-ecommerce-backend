const express = require("express");
const router = express.Router();

const {
  registerUser,
  verifyOtp,
  resendOTP,
  loginUser,
  forgetPassword,
  resetPassword,
} = require("../controllers/auth.controller");

const validate = require("../middlewares/validate.middleware");
const {
  registerSchema,
  loginSchema,
} = require("../validations/auth.schema");

// Register
router.post("/register", validate(registerSchema), registerUser);

// Verify OTP
router.post("/verify-otp", verifyOtp);

// Resend OTP
router.post("/resend-otp", resendOTP);

// Login
router.post("/login", validate(loginSchema), loginUser);

// Forgot password
router.post("/forgot-password", forgetPassword);

// Reset password
router.post("/reset-password", resetPassword);

module.exports = router;
