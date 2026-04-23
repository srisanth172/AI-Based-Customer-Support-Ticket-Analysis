const cron = require('node-cron');
const Ticket = require('../models/Ticket');

class CronService {
  init() {
    // Run every minute for development, in production usually every hour ('0 * * * *')
    cron.schedule('* * * * *', async () => {
      try {
        const now = new Date();
        const overdueTickets = await Ticket.find({
          status: { $nin: ['resolved', 'escalated'] },
          eta: { $lt: now }
        });

        if (overdueTickets.length > 0) {
          console.log(`[Cron] Found ${overdueTickets.length} overdue tickets. Auto-escalating...`);
          
          for (const ticket of overdueTickets) {
            ticket.status = 'escalated';
            ticket.activityLog.push({
              actionType: 'SYSTEM_ESCALATION',
              message: 'Ticket automatically escalated because ETA was breached.',
              timestamp: now
            });
            await ticket.save();
          }
        }
      } catch (error) {
        console.error('[Cron] Error running auto-escalation job:', error.message);
      }
    });
    console.log('[Cron] Background jobs initialized');
  }
}

module.exports = new CronService();
