const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.BREVO_SMTP_HOST,
      port: parseInt(process.env.BREVO_SMTP_PORT),
      secure: false,
      auth: { user: process.env.BREVO_SMTP_USER, pass: process.env.BREVO_SMTP_PASS }
    });
  }

  async sendPasswordResetEmail(email, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Password Reset Request - Support System',
      html: `<div><h2>Password Reset</h2><p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 15 minutes.</p><p>If you didn't request this, ignore this email.</p></div>`
    });
  }

  async sendTicketNotification(email, ticketId, subject) {
    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Ticket Update: ${ticketId}`,
      html: `<div><h2>Ticket ${ticketId} Updated</h2><p>Subject: ${subject}</p><a href="${process.env.FRONTEND_URL}/customer/tickets/${ticketId}">View Ticket</a></div>`
    });
  }
}

module.exports = new EmailService();