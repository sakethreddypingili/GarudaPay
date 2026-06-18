const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongod = null;

// connection to mongoDB
async function connectDB() {
    let dbUrl = process.env.MONGODB || process.env.MONGODB_URI;
    if (!dbUrl) {
        console.log("No MONGODB connection string found in environment. Starting MongoMemoryServer...");
        mongod = await MongoMemoryServer.create();
        dbUrl = mongod.getUri();
        console.log(`MongoMemoryServer started at: ${dbUrl}`);
    }
    await mongoose.connect(dbUrl);
}
module.exports = { connectDB };