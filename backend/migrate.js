require('dotenv').config();
const mongoose = require('mongoose');
const Ticket = require('./src/models/Ticket');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  await Ticket.updateMany({ category: 'Billing' }, { $set: { category: 'Payments' } });
  await Ticket.updateMany({ category: 'Technical Issue' }, { $set: { category: 'Product Issues' } }); // Adjusted to Product Issues
  await Ticket.updateMany({ category: 'Account Issue' }, { $set: { category: 'Account Issues' } });
  await Ticket.updateMany({ category: 'Bug Report' }, { $set: { category: 'Product Issues' } });
  await Ticket.updateMany({ category: 'General Inquiry' }, { $set: { category: 'Notifications & Communication' } });
  
  console.log('Old categories migrated successfully');
  process.exit(0);
}).catch(console.error);
