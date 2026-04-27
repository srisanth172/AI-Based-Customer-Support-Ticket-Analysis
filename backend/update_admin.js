const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./src/models/User');

dotenv.config({ path: path.join(__dirname, '.env') });

const updateAdmin = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in .env');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const admin = await User.findOne({ name: 'srisanth', role: 'admin' });
    if (admin) {
      admin.password = 'shiva@05';
      await admin.save();
      console.log('Admin password updated to shiva@05');
    } else {
      console.log('Admin srisanth not found');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

updateAdmin();
