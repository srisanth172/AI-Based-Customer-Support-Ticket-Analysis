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
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #059669; padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Verification Code</h1>
        </div>
        <div style="padding: 40px 30px; background-color: white;">
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Hello,<br><br>
            Thank you for joining our platform! To complete your registration, please use the following verification code:
          </p>
          <div style="background-color: #ecfdf5; border: 2px dashed #10b981; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 30px;">
            <span style="font-size: 36px; font-weight: 800; color: #065f46; letter-spacing: 8px;">${code}</span>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
            If you didn't request this code, you can safely ignore this email. This code will expire shortly.
          </p>
        </div>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Support System. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verify your email - Support System',
      html: html,
      text: `Your verification code is: ${code}`
    });
  }

  async sendPasswordResetEmail(email, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #059669; padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Password Reset</h1>
        </div>
        <div style="padding: 40px 30px; background-color: white;">
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Hello,<br><br>
            We received a request to reset your password. Click the button below to choose a new one:
          </p>
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${resetUrl}" style="display: inline-block; background-color: #10b981; color: white; padding: 16px 32px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 16px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">Reset Password</a>
          </div>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
            This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.
          </p>
        </div>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Support System. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Password Reset Request - Support System',
      html: html,
      text: `Reset your password at: ${resetUrl}`
    });
  }

  async sendTicketNotification(email, ticketId, subject) {
    const ticketUrl = `${process.env.FRONTEND_URL}/customer/tickets/${ticketId}`;
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #059669; padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Ticket Update</h1>
        </div>
        <div style="padding: 40px 30px; background-color: white;">
          <h2 style="color: #111827; font-size: 20px; font-weight: 700; margin-bottom: 10px;">Ticket ${ticketId} Updated</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Your ticket has been updated with new information. 
            <br><br>
            <strong>Subject:</strong> ${subject}
          </p>
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${ticketUrl}" style="display: inline-block; background-color: #10b981; color: white; padding: 16px 32px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 16px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">View Ticket Detail</a>
          </div>
        </div>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Support System. All rights reserved.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `Ticket Update: ${ticketId}`,
      html: html,
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