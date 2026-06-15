const mongoose = require("mongoose");

// connection to mongoDB
async function connectDB() {
    await mongoose.connect(process.env.MONGODB);
}
module.exports = { connectDB };