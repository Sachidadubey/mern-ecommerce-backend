const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
// const mongoSanitize = require("express-mongo-sanitize");
// const xss = require("xss-clean");

const AppError = require("./utils/AppError");
const globalErrorHandler = require("./middlewares/errorMiddleware");

// Routes
const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.route");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");
const paymentRoutes = require("./routes/payment.routes");
const reviewRoutes = require("./routes/review.routes");
const wishlistRoutes = require("./routes/wishlist.routes");

const app = express();

/* =========================
   GLOBAL MIDDLEWARES
========================= */

// Security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors());

// 🔴 PAYMENT WEBHOOK ROUTE MUST COME FIRST
app.use(
  "/api/payment/webhook",
  express.raw({ type: "application/json" })
);

// Body parser (AFTER webhook)
app.use(express.json({ limit: "10kb" }));

// Prevent NoSQL Injection
// app.use(mongoSanitize());

// Prevent XSS attacks
// app.use(xss());

// Logging (DEV only)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Rate Limiting
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again later",
});

app.use("/api", limiter);

/* =========================
   ROUTES
========================= */

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/wishlist", wishlistRoutes);

/* =========================
   UNHANDLED ROUTES
========================= */

app.use((req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

// Global error handler
app.use(globalErrorHandler);

module.exports = app;
