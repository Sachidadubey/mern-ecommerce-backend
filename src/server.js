require("dotenv").config();
const app = require("./app");
const connectDb = require("./config/db");
const { startCrons } = require("./cron/index"); // 👈 ADD THIS

const PORT = process.env.PORT || 5000;

// 1️⃣ DB connect
connectDb();

// // 2️⃣ Start cron jobs
// startCrons(); // 👈 CRON YAHAN

// 3️⃣ Start server
app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
});
