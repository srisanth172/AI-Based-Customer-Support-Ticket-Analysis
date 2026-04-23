const User = require('../models/User');
const Ticket = require('../models/Ticket');

const autoSeed = async () => {
  try {
    console.log('--- Ensuring Core Users Exist ---');
    
    // 1. Enforce ONLY 'srisanth' as admin
    const adminName = 'srisanth';
    const adminPass = 'qwerty@12';
    let admin = await User.findOne({ name: adminName, role: 'admin' });
    if (!admin) {
      admin = await User.create({
        name: adminName,
        email: 'srisanth@admin.com',
        password: adminPass,
        role: 'admin',
        isVerified: true
      });
      console.log(`Admin account created: ${adminName}`);
    } else {
      admin.password = adminPass;
      admin.isVerified = true;
      await admin.save();
      console.log(`Admin account verified/updated: ${adminName}`);
    }

    // Remove all other admin accounts except 'srisanth'
    await User.deleteMany({ role: 'admin', name: { $ne: adminName } });

    // 2. Ensure Specific Customer exists
    const customerEmail = 'customer@gmail.com';
    const customerPass = 'customer@123';
    let customer = await User.findOne({ email: customerEmail });
    if (!customer) {
      customer = await User.create({
        name: 'John Customer',
        email: customerEmail,
        password: customerPass,
        role: 'customer',
        isVerified: true
      });
      console.log(`Customer account created: ${customerEmail}`);
    } else {
      customer.password = customerPass;
      customer.isVerified = true;
      customer.role = 'customer';
      await customer.save();
      console.log(`Customer account verified: ${customerEmail}`);
    }

    // 3. Seed other demo customers if needed
    const customersCount = await User.countDocuments({ role: 'customer' });
    if (customersCount < 3) {
      const extraCustomers = [
        { name: 'Srisanth', email: 'sri@customer.io', password: 'password123', role: 'customer' },
        { name: 'Mukesh', email: 'mukesh@customer.io', password: 'password123', role: 'customer' }
      ];
      for (const c of extraCustomers) {
        if (!(await User.findOne({ email: c.email }))) {
          await User.create(c);
        }
      }
    }

    // 4. Seed Tickets if none exist for our primary customer
    const ticketsCount = await Ticket.countDocuments({ userId: customer._id });
    if (ticketsCount === 0) {
      console.log('--- Seeding Sample Tickets ---');
      const tickets = [
        {
          ticketId: 'TKT-1001',
          userId: customer._id,
          subject: 'System Overheat Warning',
          status: 'open',
          priority: 'high',
          sentiment: 'negative',
          category: 'technical',
          createdAt: new Date(Date.now() - 3600000 * 2),
          messages: [{ sender: 'user', text: 'Server rack 4 alerts.' }]
        },
        {
          ticketId: 'TKT-1002',
          userId: customer._id,
          subject: 'Billing discrepancy',
          status: 'in_progress',
          priority: 'medium',
          category: 'billing',
          createdAt: new Date(Date.now() - 3600000 * 5),
          messages: [{ sender: 'user', text: 'Invoice double charged.' }]
        }
      ];
      await Ticket.create(tickets);
      console.log('--- Ticket Seeding Complete ---');
    }
  } catch (error) {
    console.warn('Auto Seeding failed:', error.message);
  }
};

module.exports = autoSeed;
