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
exports.registerUserService = async ({ name, email, phone, password }) => {
  const existingUser = await User.findOne({ email });

  if (existingUser && existingUser.isVerified) {
    throw new AppError("Email already registered", 400);
  }

  const user =
    await User.create({
      name,
      email,
      phone,
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
    console.log('Attempting to send OTP to:', email);
    await sendEmail(
      email,
      "Verify your email :",
     `<h1>Your OTP is ${otp}</h1>`,
    );
    console.log('OTP email sent successfully');
  } catch (err) {
    console.error("Email sending error:", err.message);
    // For development/testing: log OTP to console instead of throwing
    console.log('🔐 OTP for testing:', otp);
    // Don't throw error - allow registration to continue
    // user.otp = undefined;
    // user.otpExpire = undefined;
    // await user.save({ validateBeforeSave: false });
    // throw new AppError("Failed to send OTP email", 500);
  }

  return user._id;
};

/* ========================= VERIFY OTP ========================= */
exports.verifyOtpService = async ({ email, otp }) => {
  const user = await User.findOne({ email });

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
exports.resendOtpService = async ({ email }) => {
  const user = await User.findOne({ email });

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
 await sendEmail(
  user.email,
  "Resend OTP",
  `<h1>Your OTP is ${otp}</h1>`
);
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
   await sendEmail(
    email,
    "Login Notification",
   `<h1>You have successfully logged in to anonymous server your password is ${password}</h1>`,
  );
  await user.save({ validateBeforeSave: false });
 

  return { 
    accessToken, 
    refreshToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage
    }
  };
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
  await sendEmail(
      email,
      "Password Reset OTP",
     `<h1>Your password reset OTP is ${otp}</h1>`,
    );
  console.log(`Password reset OTP email sent successfully otp: ${otp}`);
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
  await sendEmail(
    email,
    "Password Reset Successful",
   `<h1>Your password has been reset successfully ${user.password} </h1>`,
  );
};

/* ========================= LOGOUT ========================= */
exports.logoutService = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    refreshToken: undefined,
  });
};
