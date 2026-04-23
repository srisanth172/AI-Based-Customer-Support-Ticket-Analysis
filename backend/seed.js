const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();
const User = require('./src/models/User');
const Ticket = require('./src/models/Ticket');

const { MongoMemoryServer } = require('mongodb-memory-server');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to Primary MongoDB');
  } catch (err) {
    console.warn('Primary MongoDB failed, using MemoryServer for seed');
    const ms = await MongoMemoryServer.create();
    await mongoose.connect(ms.getUri());
  }
  await User.deleteMany();
  await Ticket.deleteMany();

  const admin = await User.create({
    name: 'Admin User',
    email: 'bagilishivaprasad9@gmail.com',
    password: 'shiva@05',
    role: 'admin'
  });
  const customer = await User.create({
    name: 'John Doe',
    email: 'customer@gmail.com',
    password: 'customer@123',
    role: 'customer'
  });

  await Ticket.create([
    {
      ticketId: 'TKT-1001',
      userId: customer._id,
      subject: 'Cannot login',
      status: 'open',
      priority: 'high',
      sentiment: 'negative',
      category: 'technical',
      messages: [{ sender: 'user', text: 'I cannot login to my account', timestamp: new Date() }],
      aiAnalysis: { reasoning: 'Urgent login issue', suggestedReply: 'Reset password link sent' }
    },
    {
      ticketId: 'TKT-1002',
      userId: customer._id,
      subject: 'Billing question',
      status: 'in_progress',
      priority: 'medium',
      sentiment: 'neutral',
      category: 'billing',
      messages: [{ sender: 'user', text: 'Double charged this month', timestamp: new Date() }]
    }
  ]);

  console.log('Database seeded');
  process.exit();
};

seed();