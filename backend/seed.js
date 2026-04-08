const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();
const User = require('./src/models/User');
const Ticket = require('./src/models/Ticket');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await User.deleteMany();
  await Ticket.deleteMany();

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin'
  });
  const customer = await User.create({
    name: 'John Doe',
    email: 'customer@example.com',
    password: 'customer123',
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