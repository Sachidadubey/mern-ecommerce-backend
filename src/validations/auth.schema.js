const { z } = require("zod");

/* ================= REGISTER ================= */
const registerSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .trim(),

    email: z
      .string()
      .email("Invalid email address")
      .toLowerCase(),

    phone: z
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .optional(),

    password: z
      .string()
      .min(6, "Password must be at least 6 characters"),
  }),
});

/* ================= LOGIN ================= */
const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email("Invalid email address")
      .toLowerCase(),

    password: z
      .string()
      .min(6, "Password must be at least 6 characters"),
  }),
});

/* ================= VERIFY OTP ================= */
const verifyOtpSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email("Invalid email address")
      .toLowerCase(),

    otp: z
      .string()
      .length(6, "OTP must be exactly 6 digits"),
  }),
});

/* ================= RESEND OTP ================= */
const resendOtpSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email("Invalid email address")
      .toLowerCase(),
  }),
});

/* ================= FORGOT PASSWORD ================= */
const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email("Invalid email address")
      .toLowerCase(),
  }),
});

/* ================= RESET PASSWORD ================= */
const resetPasswordSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email("Invalid email address")
      .toLowerCase(),

    otp: z
      .string()
      .length(6, "OTP must be exactly 6 digits"),

    newPassword: z
      .string()
      .min(6, "Password must be at least 6 characters"),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
