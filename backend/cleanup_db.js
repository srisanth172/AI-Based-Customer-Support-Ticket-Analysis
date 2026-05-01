const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config();

const User = require('./src/models/User');
const Ticket = require('./src/models/Ticket');
const Notification = require('./src/models/Notification');
const LiveChat = require('./src/models/LiveChat');

async function cleanupDatabase() {
    try {
        console.log('Connecting to MongoDB...');
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI not found in .env');
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        console.log('Clearing notifications...');
        await Notification.deleteMany({});

        console.log('Clearing tickets...');
        await Ticket.deleteMany({});
        
        console.log('Clearing live chats...');
        await LiveChat.deleteMany({});

        console.log('Clearing customers...');
        // Delete all users EXCEPT those with role 'admin'
        const result = await User.deleteMany({ role: { $ne: 'admin' } });
        console.log(`Deleted ${result.deletedCount} non-admin users.`);

        console.log('\n--- Database Cleanup Successful ---');
        process.exit(0);
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    }
}

cleanupDatabase();
