const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongod = null;

// connection to mongoDB
async function connectDB() {
    let dbUrl = process.env.MONGODB || process.env.MONGODB_URI;
    try {
        if (!dbUrl) {
            throw new Error("No MONGODB connection string found in environment.");
        }
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(dbUrl, { serverSelectionTimeoutMS: 4000 });
        console.log("MongoDB Atlas connected successfully.");
    } catch (err) {
        console.warn("MongoDB Atlas connection failed. Falling back to MongoMemoryServer:", err.message);
        mongod = await MongoMemoryServer.create();
        dbUrl = mongod.getUri();
        await mongoose.connect(dbUrl);
        console.log(`MongoMemoryServer connected successfully at: ${dbUrl}`);
    }
}
module.exports = { connectDB };