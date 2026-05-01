const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars from backend directory
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const User = require('../backend/src/models/User');
const Ticket = require('../backend/src/models/Ticket');
const Notification = require('../backend/src/models/Notification');

async function cleanupDatabase() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        // 1. Delete all notifications
        console.log('Clearing notifications...');
        await Notification.deleteMany({});

        // 2. Delete all tickets
        console.log('Clearing tickets...');
        await Ticket.deleteMany({});

        // 3. Delete all users EXCEPT those with role 'admin'
        console.log('Clearing customers...');
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
