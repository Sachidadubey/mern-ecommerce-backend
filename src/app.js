const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middlewares/errorMiddleware');
const testRoutes = require("./routes/test.routes");
const productRoutes = require("./routes/product.route");
const authRoutes = require("./routes/auth.routes");
const cartRoutes = require("./routes/cart.routes");
const cookieParser = require("cookie-parser");



const app = express();

// middlewares
app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(morgan("dev"));



// health route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Backend API is running"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/test", testRoutes);

 app.get("/error-test", (req, res) => {
   throw new Error("Testing error handling");
  });

app.use(errorHandler);
module.exports = app;



//middlewares  ➝ routes  ➝ error handler