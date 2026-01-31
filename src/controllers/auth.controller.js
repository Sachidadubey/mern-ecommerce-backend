const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/auth.service");
const { email } = require("zod");

/* ================= REGISTER ================= */
exports.registerUser = asyncHandler(async (req, res) => {
  console.log('Register request received:', req.body);
  const userId = await authService.registerUserService(req.body);
  console.log('User registered successfully:', userId);

  res.status(201).json({
    success: true,
    message: "OTP sent to email",
    userId,
  });
});

/* ================= VERIFY OTP ================= */
exports.verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const result =
  await authService.verifyOtpService({ email, otp });

  res.status(200).json({
    success: true,
    message: "logged in successfully",
    data: result,
  });
});

/* ================= RESEND OTP ================= */
exports.resendOtp = asyncHandler(async (req, res) => {
  const email =req.body.email;
  await authService.resendOtpService({ email });

  res.status(200).json({
    success: true,
    message: "OTP resent successfully",
  });
});

/* ================= LOGIN ================= */
exports.loginUser = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken, user } =
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
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
      },
      token: accessToken,
    },
  });
});

/* ================= FORGOT PASSWORD ================= */
exports.forgotPassword = asyncHandler(async (req, res) => {
  const {email}= req.body;
  await authService.forgotPasswordService({ email });

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

// refresh token


exports.refreshToken = asyncHandler(async (req, res) => {
  // OPTION 1: refresh token from cookie (recommended)
  const refreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  const tokens = await authService.refreshTokenService(refreshToken);

  // If you are using cookies
  res.cookie("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    success: true,
    message: "Token refreshed successfully",
    accessToken: tokens.accessToken,
  });
});