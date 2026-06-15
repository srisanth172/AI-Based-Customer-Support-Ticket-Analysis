const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./backend/src/models/User');

dotenv.config();

const updateAdmin = async () => {
  try {
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
    console.error(err);
    process.exit(1);
  }
};

updateAdmin();
