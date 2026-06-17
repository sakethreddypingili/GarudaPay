const mongoose = require("mongoose");

async function connectDB() {
  const mongoUri = process.env.MONGODB || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB or MONGODB_URI is not defined");
  }

  await mongoose.connect(mongoUri);
}

module.exports = { connectDB };
