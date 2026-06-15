const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./src/models/User');
const Ticket = require('./src/models/Ticket');
const Notification = require('./src/models/Notification');

dotenv.config({ path: path.join(__dirname, '.env') });

const cleanup = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in .env');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Delete all customers (keep admins)
    const userResult = await User.deleteMany({ role: 'customer' });
    console.log(`Deleted ${userResult.deletedCount} customer accounts.`);

    // 2. Delete all tickets
    const ticketResult = await Ticket.deleteMany({});
    console.log(`Deleted ${ticketResult.deletedCount} tickets.`);

    // 3. Delete all notifications (clean slate)
    const notifResult = await Notification.deleteMany({});
    console.log(`Deleted ${notifResult.deletedCount} notifications.`);

    console.log('Cleanup complete. Admin "srisanth" remains untouched.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error during cleanup:', err.message);
    process.exit(1);
  }
};

cleanup();
