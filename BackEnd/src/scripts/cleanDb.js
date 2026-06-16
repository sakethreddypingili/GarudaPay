const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');

const cleanDatabase = async () => {
    try {
        const connURI = process.env.MONGODB_URI || "mongodb://admin:secretpassword@localhost:27017/garudapay?authSource=admin";
        console.log(`Connecting to database to clean: ${connURI}`);
        await mongoose.connect(connURI);
        
        const db = mongoose.connection.db;
        
        // List all collections
        const collections = await db.listCollections().toArray();
        for (let collection of collections) {
            console.log(`Dropping collection: ${collection.name}`);
            await db.dropCollection(collection.name);
        }
        
        console.log('Database cleaned successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error cleaning database:', error.message);
        process.exit(1);
    }
};

cleanDatabase();
