const mongoose = require("mongoose");

async function connectDB() {
    await mongoose.connect(process.env.MONGODB);
}
module.exports = { connectDB };