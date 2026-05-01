require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

const resetPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const hashedPasswordAdmin = await bcrypt.hash('qwerty@12', 12);
    await User.updateOne({ email: 'srisanth@admin.com' }, { $set: { password: hashedPasswordAdmin } });
    console.log('Admin password hashed and updated.');

    const hashedPasswordCustomer = await bcrypt.hash('customer@123', 12);
    await User.updateOne({ email: 'customer@gmail.com' }, { $set: { password: hashedPasswordCustomer } });
    console.log('Customer password hashed and updated.');

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
};

resetPasswords();
