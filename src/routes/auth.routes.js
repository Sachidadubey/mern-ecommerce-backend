const express = require("express");
const {
  registerUser,
  verifyOtp,
  resendOTP,
  loginUser,
  forgetPassword,
  resetPassword
} = require("../controllers/auth.controller");

const router = express.Router();

// ==============================
// AUTH ROUTES
// ==============================

// Register user + send email OTP
router.post("/register", registerUser);

// Verify email OTP
router.post("/verify-otp", verifyOtp);

// Resend email OTP (with cooldown)
router.post("/resend-otp", resendOTP);

// Login (only verified users)
router.post("/login", loginUser);

// Forgot password (send OTP)
router.post("/forgot-password", forgetPassword);

// Reset password using OTP
router.post("/reset-password", resetPassword);

module.exports = router;


//router = local route handler later we plug it in main app
