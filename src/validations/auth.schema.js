const { z } = require("zod");

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const verifyOtpSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

const resendOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const resetPasswordSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

module.exports = { 
  registerSchema, 
  loginSchema, 
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
