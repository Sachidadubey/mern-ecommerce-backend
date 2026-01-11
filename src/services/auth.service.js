const User = require("../models/User.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");
const generateOtp = require("../utils/generateOtp");

/**
 * JWT generator
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

/**
 * =========================
 * REGISTER USER
 * =========================
 */
exports.registerUserService = async ({ name, email, password }) => {
  const userExist = await User.findOne({ email });
  if (userExist) {
    throw new AppError("Email already registered", 400);
  }

  const otp = generateOtp();
  const hashedOtp = await bcrypt.hash(otp, 10);

  const user = await User.create({
    name,
    email,
    password,
    otp: hashedOtp,
    otpExpire: Date.now() + 10 * 60 * 1000,
    otpAttempts: 0,
    lastOtpSentAt: Date.now(),
    isVerified: false,
  });

  return user._id;
};

/**
 * =========================
 * VERIFY OTP
 * =========================
 */
exports.verifyOtpService = async ({ userId, otp }) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  if (user.isVerified)
    throw new AppError("User already verified", 400);

  if (user.otpAttempts >= 5)
    throw new AppError("Too many attempts. Please request new OTP.", 429);

  if (user.otpExpire < Date.now())
    throw new AppError("OTP expired", 400);

  const isValid = await bcrypt.compare(otp, user.otp);
  if (!isValid) {
    user.otpAttempts += 1;
    await user.save();
    throw new AppError("Invalid OTP", 400);
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpire = undefined;
  user.otpAttempts = 0;
  user.lastOtpSentAt = undefined;

  await user.save();
};

/**
 * =========================
 * RESEND OTP
 * =========================
 */
exports.resendOTPService = async ({ userId }) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  if (user.isVerified)
    throw new AppError("User already verified", 400);

  if (
    user.lastOtpSentAt &&
    Date.now() - user.lastOtpSentAt < 60 * 1000
  ) {
    throw new AppError("Please wait before requesting new OTP", 429);
  }

  const otp = generateOtp();
  user.otp = await bcrypt.hash(otp, 10);
  user.otpExpire = Date.now() + 10 * 60 * 1000;
  user.otpAttempts = 0;
  user.lastOtpSentAt = Date.now();

  await user.save();
};

/**
 * =========================
 * LOGIN USER
 * =========================
 */
exports.loginUserService = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user) throw new AppError("Invalid credentials", 400);

  if (!user.isVerified)
    throw new AppError("Please verify your email first", 401);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError("Invalid credentials", 400);

  return generateToken(user._id);
};

/**
 * =========================
 * FORGOT PASSWORD
 * =========================
 */
exports.forgetPasswordService = async ({ email }) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError("User not found", 404);

  const otp = generateOtp();
  user.otp = await bcrypt.hash(otp, 10);
  user.otpExpire = Date.now() + 10 * 60 * 1000;
  user.lastOtpSentAt = Date.now();
  user.otpAttempts = 0;

  await user.save();
};

/**
 * =========================
 * RESET PASSWORD
 * =========================
 */
exports.resetPasswordService = async ({ email, otp, newPassword }) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError("User not found", 404);

  if (user.otpExpire < Date.now())
    throw new AppError("OTP expired", 400);

  const isValid = await bcrypt.compare(otp, user.otp);
  if (!isValid) throw new AppError("Invalid OTP", 400);

  user.password = newPassword;
  user.otp = undefined;
  user.otpExpire = undefined;
  user.lastOtpSentAt = undefined;
  user.otpAttempts = 0;

  await user.save();
};
