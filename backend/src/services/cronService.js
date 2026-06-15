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

        // 9. Auto-Close System: Close tickets marked Resolved after 24 hours of no response
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const resolvedToClose = await Ticket.find({
          status: 'resolved',
          updatedAt: { $lt: oneDayAgo }
        });

        if (resolvedToClose.length > 0) {
          for (const ticket of resolvedToClose) {
            ticket.status = 'closed';
            ticket.activityLog.push({
              actionType: 'SYSTEM_CLOSE',
              message: 'Ticket automatically closed after 24 hours in Resolved state.',
              timestamp: now
            });
            await ticket.save();
          }
          console.log(`[Cron] Auto-closed ${resolvedToClose.length} resolved tickets.`);
        }

        // Auto-resolve idle tickets where admin was the last to reply (to keep queue clean)
        const idleTickets = await Ticket.find({
          status: { $in: ['open', 'in_progress', 'waiting_for_customer'] },
          updatedAt: { $lt: oneDayAgo }
        });

        if (idleTickets.length > 0) {
          let resolvedCount = 0;
          for (const ticket of idleTickets) {
            const lastMessage = ticket.messages[ticket.messages.length - 1];
            if (lastMessage && lastMessage.sender === 'admin') {
              ticket.status = 'resolved';
              ticket.resolvedAt = now;
              ticket.messages.push({
                sender: 'bot',
                text: 'Ticket has been automatically marked as Resolved due to inactivity. You can reopen it by replying.',
                timestamp: now
              });
              await ticket.save();
              resolvedCount++;
            }
          }
          if (resolvedCount > 0) {
            console.log(`[Cron] Auto-resolved ${resolvedCount} idle tickets.`);
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
