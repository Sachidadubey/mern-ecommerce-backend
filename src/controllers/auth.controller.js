const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/auth.service");

exports.registerUser = asyncHandler(async (req, res) => {
  const userId = await authService.registerUserService(req.body);

  res.status(201).json({
    success: true,
    message: "OTP sent to email",
    userId,
  });
});

exports.verifyOtp = asyncHandler(async (req, res) => {
  await authService.verifyOtpService(req.body);

  res.status(200).json({
    success: true,
    message: "Email verified successfully",
  });
});

exports.resendOTP = asyncHandler(async (req, res) => {
  await authService.resendOTPService(req.body);

  res.status(200).json({
    success: true,
    message: "OTP resent successfully",
  });
});

exports.loginUser = asyncHandler(async (req, res) => {
  const token = await authService.loginUserService(req.body);

  res.status(200).json({
    success: true,
    message: "Login successful",
    token,
  });
});

exports.forgetPassword = asyncHandler(async (req, res) => {
  await authService.forgetPasswordService(req.body);

  res.status(200).json({
    success: true,
    message: "Password reset OTP sent to email",
  });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPasswordService(req.body);

  res.status(200).json({
    success: true,
    message: "Password reset successfully",
  });
});
