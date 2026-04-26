require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const testLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const admin = await User.findOne({ email: 'srisanth@admin.com' });
    if (admin) {
      console.log('Admin found. Password hash:', admin.password);
      const isMatch = await admin.matchPassword('qwerty@12');
      console.log('Does qwerty@12 match?', isMatch);
      const isMatch2 = await admin.matchPassword('qwerty<>');
      console.log('Does qwerty<> match?', isMatch2);
      
      const isMatch3 = await admin.matchPassword('password123');
      console.log('Does password123 match?', isMatch3);
    } else {
      console.log('Admin user not found');
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
};

testLogin();
