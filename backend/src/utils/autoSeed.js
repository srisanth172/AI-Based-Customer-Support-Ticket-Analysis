const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Ticket = require('../models/Ticket');

const autoSeed = async () => {
  try {
    console.log('--- Ensuring Core Users Exist ---');

    const adminName = 'srisanth';
    const adminEmail = 'srisanth@admin.com';
    const adminPass = 'qwerty@12';

    // Always force-set a correctly hashed password for admin using updateOne
    // (bypasses mongoose isModified issue that can leave plain-text passwords)
    const hashedAdminPass = await bcrypt.hash(adminPass, 12);
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPass,
        role: 'admin',
        isVerified: true
      });
      console.log(`Admin account created: ${adminName}`);
    } else {
      // Force-correct the password hash and ensure verified/role are right
      await User.updateOne(
        { email: adminEmail },
        { $set: { password: hashedAdminPass, isVerified: true, role: 'admin', name: adminName } }
      );
      console.log(`Admin credentials ensured: ${adminName}`);
      admin = await User.findOne({ email: adminEmail });
    }

    // Remove all other admin accounts except 'srisanth'
    await User.deleteMany({ role: 'admin', name: { $ne: adminName } });

    // 2. Ensure Specific Customer exists
    const customerEmail = 'customer@gmail.com';
    const customerPass = 'customer@123';
    const hashedCustomerPass = await bcrypt.hash(customerPass, 12);
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
      // Force-correct the password hash and ensure verified/role are right
      await User.updateOne(
        { email: customerEmail },
        { $set: { password: hashedCustomerPass, isVerified: true, role: 'customer' } }
      );
      console.log(`Customer credentials ensured: ${customerEmail}`);
      customer = await User.findOne({ email: customerEmail });
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
