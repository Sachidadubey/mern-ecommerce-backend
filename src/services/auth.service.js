const User = require("../models/User.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const  generateOtp  = require("../utils/generateOtp");
const {
  generateToken,
  generateRefreshToken,
} = require("../utils/generateToken");
const { sendEmail } = require("./sendEmail.service");

/* ========================= REGISTER ========================= */
exports.registerUserService = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });

  if (existingUser && existingUser.isVerified) {
    throw new AppError("Email already registered", 400);
  }

  const user =
    await User.create({
      name,
      email,
      password,
      isVerified: false,
    });

  const otp = generateOtp();
  user.otp = await bcrypt.hash(otp, 10);
  user.otpExpire = Date.now() + 10 * 60 * 1000;
  user.otpAttempts = 0;
  user.lastOtpSentAt = Date.now();

  await user.save({ validateBeforeSave: false });
  
  try {
    await sendEmail(
      email,
      "Verify your email :",
     `<h1>Your OTP is ${otp}</h1>`,
    );
  } catch (err) {
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save({ validateBeforeSave: false });
    console.log("smtp error", err);
    throw new AppError("Failed to send OTP email", 500);
  }

  return user._id;
};

/* ========================= VERIFY OTP ========================= */
exports.verifyOtpService = async ({ userId, otp }) => {
  const user = await User.findById(userId);


  if (!user) throw new AppError("User not found", 404);
  if (user.isVerified) throw new AppError("User already verified", 400);
  if (!user.otp || !user.otpExpire)
    throw new AppError("OTP not sent", 400);

  // OTP expired
  if (user.otpExpire < Date.now()) {
    user.otp = undefined;
    user.otpExpire = undefined;
    user.otpAttempts = 0;
    user.lastOtpSentAt = undefined;
    await user.save({ validateBeforeSave: false });
    throw new AppError("OTP expired", 400);
  }

  // Too many wrong attempts
  if (user.otpAttempts >= 5) {
    user.otp = undefined;
    user.otpExpire = undefined;
    user.otpAttempts = 0;
    user.lastOtpSentAt = undefined;
    await user.save({ validateBeforeSave: false });
    throw new AppError("Too many wrong attempts. Please request new OTP", 429);
  }

  const isValid = await bcrypt.compare(otp, user.otp);

  // Wrong OTP
  if (!isValid) {
    user.otpAttempts += 1;
    await user.save({ validateBeforeSave: false });
    throw new AppError("Invalid OTP", 400);
  }

 // ✅ OTP VERIFIED — AUTO LOGIN STARTS HERE
  user.isVerified = true;
  user.otp = undefined;
  user.otpExpire = undefined;
  user.otpAttempts = 0;
  user.lastOtpSentAt = undefined;

  // Generate tokens
  const accessToken = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};
/* ========================= RESEND OTP ========================= */
exports.resendOtpService = async ({ userId }) => {
  const user = await User.findById(userId);

  if (!user) throw new AppError("User not found", 404);
  if (user.isVerified) throw new AppError("User already verified", 400);

  // Rate limit: 60 seconds
  if (user.lastOtpSentAt && Date.now() - user.lastOtpSentAt < 60 * 1000) {
    throw new AppError("Please wait 60 seconds before requesting new OTP", 429);
  }

  const otp = generateOtp();

  user.otp = await bcrypt.hash(otp, 10);
  user.otpExpire = Date.now() + 10 * 60 * 1000;
  user.lastOtpSentAt = Date.now();

  // ❌ DO NOT touch otpAttempts here

  await user.save({ validateBeforeSave: false });

  try {
    await sendEmail({
      to: user.email,
      subject: "Resend OTP",
      text: `Your OTP is ${otp}`,
    });
  } catch (err) {
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save({ validateBeforeSave: false });
    throw new AppError("Failed to resend OTP", 500);
  }
};

/* ========================= LOGIN ========================= */
exports.loginUserService = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password +refreshToken");
  if (!user) throw new AppError("Invalid credentials", 400);
  if (!user.isVerified) {
    throw new AppError("Please verify your email first", 401);
  }

  const match = await user.comparePassword(password);
  if (!match) throw new AppError("Invalid credentials", 400);

  const accessToken = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

/* ========================= REFRESH TOKEN ========================= */
exports.refreshTokenService = async (refreshToken) => {
  if (!refreshToken) throw new AppError("Refresh token missing", 401);

  let decoded;
  try {
    decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
  } catch {
    throw new AppError("Invalid refresh token", 401);
  }

  const user = await User.findById(decoded.id).select("+refreshToken");
  if (!user || user.refreshToken !== refreshToken) {
    throw new AppError("Refresh token invalid", 401);
  }

  const newAccessToken = generateToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

/* ========================= FORGOT PASSWORD ========================= */
exports.forgotPasswordService = async ({ email }) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError("User not found", 404);

  const otp = generateOtp();
  user.otp = await bcrypt.hash(otp, 10);
  user.otpExpire = Date.now() + 10 * 60 * 1000;
  user.otpAttempts = 0;
  user.lastOtpSentAt = Date.now();

  await user.save({ validateBeforeSave: false });

  try {
    await sendEmail({
      to: user.email,
      subject: "Reset Password OTP",
      text: `Your OTP is ${otp}`,
    });
  } catch (err) {
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save({ validateBeforeSave: false });
    throw new AppError("Failed to send reset OTP", 500);
  }
};

/* ========================= RESET PASSWORD ========================= */
exports.resetPasswordService = async ({ email, otp, newPassword }) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError("User not found", 404);
  if (!user.otp || !user.otpExpire) throw new AppError("OTP not sent", 400);
  if (user.otpExpire < Date.now()) throw new AppError("OTP expired", 400);

  const valid = await bcrypt.compare(otp, user.otp);
  if (!valid) throw new AppError("Invalid OTP", 400);

  user.password = newPassword;
  user.otp = undefined;
  user.otpExpire = undefined;
  user.otpAttempts = 0;
  user.lastOtpSentAt = undefined;
  user.refreshToken = undefined; // force re-login

  await user.save({ validateBeforeSave: false });
};

/* ========================= LOGOUT ========================= */
exports.logoutService = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    refreshToken: undefined,
  });
};
