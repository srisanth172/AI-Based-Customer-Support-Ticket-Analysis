require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const resetPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    let admin = await User.findOne({ email: 'srisanth@admin.com' });
    if (admin) {
      admin.password = 'qwerty@12';
      await admin.save();
      console.log('Admin password reset to qwerty@12');
    } else {
      console.log('Admin user not found');
    }

    let customer = await User.findOne({ email: 'customer@gmail.com' });
    if (customer) {
      customer.password = 'customer@123';
      await customer.save();
      console.log('Customer password reset to customer@123');
    } else {
      console.log('Customer user not found');
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
};

resetPasswords();
