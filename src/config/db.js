const mongoose = require('mongoose');

const connectDb = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log(`MongoDb Connected ${conn.connection.host}`);

  }
  catch (error) {
    console.error(`MongoDb Connection Error ${error}`);
    // it prints on standard error
    process.exit(1);
    // stops the server if db not connected 
  }
 
};
module.exports = connectDb;
// why diffrent from server and all __--- single responsibility , reusable 