const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

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

const app = express();

/* =========================
   SECURITY & BASIC MIDDLEWARES
========================= */

app.use(helmet());
app.use(cors({
   origin: process.env.CLIENT_URL,
  credentials: true
}));

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

/* =========================
   LOGGING
========================= */
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

/* =========================
   RATE LIMITING
========================= */
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", limiter);

/* =========================
   ROUTES
========================= */

app.get("/", (req, res) => {
  res.status(200).send("Server running. Payments powered by Razorpay.");
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes); // create payment etc
app.use("/api/reviews", reviewRoutes);
app.use("/api/wishlist", wishlistRoutes);

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
