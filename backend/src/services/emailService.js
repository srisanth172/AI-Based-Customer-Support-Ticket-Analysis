const axios = require('axios');

class EmailService {
  constructor() {
    this.apiKey = process.env.BREVO_API_KEY;
    this.sender = {
      email: process.env.EMAIL_FROM || 'bagilishivaprasad9@gmail.com',
      name: 'Support System'
    };
  }

  async sendEmail({ to, subject, text, html }) {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.warn('Brevo API key missing. Email not sent.');
      return;
    }
    
    const senderEmail = process.env.EMAIL_FROM || 'bagilishivaprasad9@gmail.com';
    
    try {
      const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { email: senderEmail, name: 'Support System' },
          to: [{ email: to }],
          subject: subject,
          htmlContent: html || `<html><body><p>${text}</p></body></html>`,
          textContent: text
        },
        {
          headers: {
            'api-key': apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Email sending failed:', error.response ? error.response.data : error.message);
      throw new Error('Failed to send email via Brevo');
    }
  }

  async sendVerificationEmail(email, code) {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to Support! Verification Code',
      html: `<div><h2>Verify your Email</h2><p>Your verification code is: <strong>${code}</strong></p></div>`,
      text: `Your verification code is: ${code}`
    });
  }

  async sendPasswordResetEmail(email, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    return this.sendEmail({
      to: email,
      subject: 'Password Reset Request - Support System',
      html: `<div><h2>Password Reset</h2><p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 15 minutes.</p><p>If you didn't request this, ignore this email.</p></div>`,
      text: `Reset your password at: ${resetUrl}`
    });
  }

  async sendTicketNotification(email, ticketId, subject) {
    return this.sendEmail({
      to: email,
      subject: `Ticket Update: ${ticketId}`,
      html: `<div><h2>Ticket ${ticketId} Updated</h2><p>Subject: ${subject}</p><a href="${process.env.FRONTEND_URL}/customer/tickets/${ticketId}">View Ticket</a></div>`,
      text: `Ticket ${ticketId} Updated. Subject: ${subject}`
    });
  }
}

const instance = new EmailService();
module.exports = {
  sendEmail: instance.sendEmail.bind(instance),
  sendVerificationEmail: instance.sendVerificationEmail.bind(instance),
  sendPasswordResetEmail: instance.sendPasswordResetEmail.bind(instance),
  sendTicketNotification: instance.sendTicketNotification.bind(instance)
};