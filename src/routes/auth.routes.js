const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const validate = require("../middlewares/validate.middleware");
const { protect } = require("../middlewares/auth.middleware");

const {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("../validations/auth.schema");

/* ================= AUTH ROUTES ================= */

// Register user + send OTP
router.post(
  "/register",
  validate(registerSchema),
  authController.registerUser
);

// Verify OTP
router.post(
  "/verify-otp",
  validate(verifyOtpSchema),
  authController.verifyOtp
);

// Resend OTP
router.post(
  "/resend-otp",
  validate(resendOtpSchema),
  authController.resendOtp
);

// Login
router.post(
  "/login",
  validate(loginSchema),
  authController.loginUser
);

// Logout
router.post(
  "/logout",
  protect,
  authController.logout
);

// Forgot password
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

// Reset password
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword
);

module.exports = router;