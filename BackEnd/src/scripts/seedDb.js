const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/user.model');
const Transaction = require('../models/transaction.model');

const seedDatabase = async () => {
    try {
        const connURI = process.env.MONGODB_URI || "mongodb://admin:secretpassword@localhost:27017/garudapay?authSource=admin";
        console.log(`Connecting to database to seed: ${connURI}`);
        await mongoose.connect(connURI);

        // Clear existing data to ensure clean setup
        console.log('Clearing existing data...');
        await User.deleteMany({});
        await Transaction.deleteMany({});

        // Create default user
        console.log('Creating default demo user...');
        const user = new User({
            name: 'Demo User',
            email: 'demo@garudapay.com',
            password: 'password123',
            balance: 1000.00
        });
        await user.save();

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error.message);
        process.exit(1);
    }
};

seedDatabase();
