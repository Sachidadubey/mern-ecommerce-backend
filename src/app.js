const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const cookieParser = require("cookie-parser");

const AppError = require("./utils/AppError");
const globalErrorHandler = require("./middlewares/errorMiddleware");

// Controllers
const paymentController = require("./controllers/payment.controller");

// Routes
const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.route");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");
const paymentRoutes = require("./routes/payment.routes");
const reviewRoutes = require("./routes/review.routes");
const wishlistRoutes = require("./routes/wishlist.routes");
const categoryRoutes = require("./routes/category.routes");
const adminRoutes = require("./routes/admin.routes");
const couponRoutes = require("./routes/coupon.routes");
const userRoutes = require("./routes/user.routes");
const supportRoutes = require("./routes/support.routes");

const app = express();

// Trust proxy if behind a reverse proxy (production)
app.set("trust proxy", 1);

/* =========================
   SECURITY & BASIC MIDDLEWARES
========================= */

app.use(helmet());
app.use(cors({
   origin: (origin, callback) => {
      const allowedOrigins = [
         'http://localhost:3000',
         'http://localhost:3001',
         process.env.CLIENT_URL
      ].filter(Boolean);
      if (!origin || allowedOrigins.includes(origin)) {
         callback(null, true);
      } else {
         callback(new Error('Not allowed by CORS'));
      }
   },
   credentials: true,
   optionsSuccessStatus: 200
}));
app.use(cookieParser());

/* =========================
   🔴 RAZORPAY WEBHOOK (MUST BE FIRST)
========================= */
app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  paymentController.razorpayWebhook
);

/* =========================
   BODY PARSER (AFTER WEBHOOK)
========================= */
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ limit: "10kb", extended: true }));

/* =========================
   DATA SANITIZATION (Security)
========================= */
// mongoSanitize disabled due to conflicts with request object - using express built-in protection instead
// app.use(mongoSanitize({ replaceWith: '_' })); // Prevent NoSQL injection

/* =========================
   LOGGING
========================= */
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  // Production logging
  app.use(morgan("combined"));
}

/* =========================
   RATE LIMITING - General API
========================= */
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests, please try again later",
  skip: (req) => process.env.NODE_ENV === "development", // Skip in development
});

/* =========================
   AUTH RATE LIMITING (Stricter)
========================= */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful requests
  message: "Too many login attempts, please try again later",
  skip: (req) => process.env.NODE_ENV === "development",
});

app.use("/api", limiter);
app.post("/api/auth/login", authLimiter);
app.post("/api/auth/register", authLimiter);
app.post("/api/auth/forgot-password", authLimiter);

/* =========================
   ROUTES
========================= */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "E-commerce API Server",
    version: "1.0.0",
    powered: "Razorpay Payments",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/support", supportRoutes);

/* =========================
   HEALTH CHECK ENDPOINT
========================= */
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
  });
});

/* =========================
   404 HANDLER
========================= */
app.use((req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl}`, 404));
});

/* =========================
   GLOBAL ERROR HANDLER
========================= */
app.use(globalErrorHandler);

module.exports = app;
