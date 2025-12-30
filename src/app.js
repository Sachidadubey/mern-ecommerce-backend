const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

// middlewares
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));


// health route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Backend API is running"
  });
});

module.exports = app;