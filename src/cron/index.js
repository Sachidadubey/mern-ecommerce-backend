const cron = require("node-cron");
const { handleStuckPayments } = require("./stuckPayment.cron");

exports.startCrons = () => {
  // Every 10 minutes
  cron.schedule("*/10 * * * *", async () => {
    console.log("🕒 Running stuck payment cron...");
    await handleStuckPayments();
  });
};
