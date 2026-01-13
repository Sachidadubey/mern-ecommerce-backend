const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/auth.service");

/* ================= REGISTER ================= */
exports.registerUser = asyncHandler(async (req, res) => {
  const userId = await authService.registerUserService(req.body);

  res.status(201).json({
    success: true,
    message: "OTP sent to email",
    userId,
  });
});

/* ================= VERIFY OTP ================= */
exports.verifyOtp = asyncHandler(async (req, res) => {
  await authService.verifyOtpService(req.body);

  res.status(200).json({
    success: true,
    message: "Email verified successfully",
  });
});

/* ================= RESEND OTP ================= */
exports.resendOtp = asyncHandler(async (req, res) => {
  await authService.resendOtpService(req.body);

  res.status(200).json({
    success: true,
    message: "OTP resent successfully",
  });
});

/* ================= LOGIN ================= */
exports.loginUser = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken } =
    await authService.loginUserService(req.body);

  // send refresh token via httpOnly cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    message: "Login successful",
    accessToken,
  });
});

/* ================= FORGOT PASSWORD ================= */
exports.forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPasswordService(req.body);

  res.status(200).json({
    success: true,
    message: "Password reset OTP sent to email",
  });
});

/* ================= RESET PASSWORD ================= */
exports.resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPasswordService(req.body);

  res.status(200).json({
    success: true,
    message: "Password reset successfully",
  });
});

/* ================= LOGOUT (PROTECTED) ================= */
exports.logout = asyncHandler(async (req, res) => {
  await authService.logoutService(req.user.id);

  res.clearCookie("refreshToken");

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});