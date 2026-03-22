const nodemailer = require('nodemailer');
const pdfGenerator = require('./pdfGenerator');
const path = require('path');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Debug logging
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Present' : 'Missing ❌');
    
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('⚠️  Email service not configured. Please set EMAIL_USER and EMAIL_PASS in .env file');
      this.transporter = null;
      return;
    }

    // Email configuration - you can use Gmail, Outlook, or any SMTP service
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail', // 'gmail', 'outlook', etc.
      auth: {
        user: process.env.EMAIL_USER, // your-email@gmail.com
        pass: process.env.EMAIL_PASS  // your-app-password
      },
      tls: {
        rejectUnauthorized: false // Allow self-signed certificates
      },
      secure: false, // Use TLS instead of SSL
      port: 587 // Gmail SMTP port
    });

    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email service error:', error.message);
        console.log('🔧 Troubleshooting steps:');
        console.log('1. Make sure you have 2-factor authentication enabled on your Gmail account');
        console.log('2. Generate an App Password: https://myaccount.google.com/apppasswords');
        console.log('3. Use the App Password (not your regular password) in EMAIL_PASS');
        console.log('4. Check that EMAIL_USER is your full Gmail address');
        
        // Try alternative configuration for Gmail
        if (process.env.EMAIL_SERVICE === 'gmail' || !process.env.EMAIL_SERVICE) {
          console.log('🔄 Trying alternative Gmail configuration...');
          this.tryAlternativeGmailConfig();
        }
      } else {
        console.log('✅ Email service ready:', success);
        console.log('📧 Ticket emails will be sent to attendee email addresses');
      }
    });
  }

  tryAlternativeGmailConfig() {
    // Alternative Gmail configuration with explicit SMTP settings
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      }
    });

    // Test the alternative configuration
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Alternative Gmail config also failed:', error.message);
        console.log('💡 Please check your Gmail App Password setup');
      } else {
        console.log('✅ Alternative Gmail configuration successful!');
        console.log('📧 Email service is now ready');
      }
    });
  }

  async sendTicketEmail(booking, event, user) {
    try {
      // Check if email service is configured
      if (!this.transporter) {
        console.log('⚠️  Email service not configured. Skipping email send.');
        return {
          success: false,
          error: 'Email service not configured'
        };
      }

      // Generate PDF ticket
      const pdfResult = await pdfGenerator.generateTicketPDF(booking, event, user);
      
      // Email content
      const emailSubject = `Your Event Ticket - ${event.title}`;
      const emailHtml = this.generateEmailHTML(booking, event, user);
      const emailText = this.generateEmailText(booking, event, user);

      // Email options
      const mailOptions = {
        from: {
          name: 'EventHub',
          address: process.env.EMAIL_USER
        },
        to: user.email,
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
        attachments: [
          {
            filename: pdfResult.fileName,
            path: pdfResult.filePath,
            contentType: 'application/pdf'
          }
        ]
      };

      // Send email
      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('Ticket email sent successfully:', result.messageId);
      
      // Clean up PDF file after sending (optional)
      setTimeout(() => {
        try {
          require('fs').unlinkSync(pdfResult.filePath);
        } catch (error) {
          console.error('Error deleting PDF file:', error);
        }
      }, 5000); // Delete after 5 seconds

      return {
        success: true,
        messageId: result.messageId,
        fileName: pdfResult.fileName
      };

    } catch (error) {
      console.error('Error sending ticket email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendPasswordResetEmail(user, resetLink) {
    try {
      if (!this.transporter) {
        console.log('Password reset email skipped because transporter is not configured.');
        return {
          success: false,
          error: 'Email service not configured'
        };
      }

      const mailOptions = {
        from: {
          name: 'EventHub',
          address: process.env.EMAIL_USER
        },
        to: user.email,
        subject: 'EventHub Password Reset',
        text: `Hello ${user.name},\n\nUse this link to reset your password: ${resetLink}\n\nThis link expires in 30 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
            <h2 style="color: #4f46e5;">Reset Your Password</h2>
            <p>Hello ${user.name},</p>
            <p>Humne aapke account ke liye password reset request receive ki hai.</p>
            <p>
              <a href="${resetLink}" style="display: inline-block; padding: 12px 20px; border-radius: 8px; background: #4f46e5; color: #ffffff; text-decoration: none; font-weight: bold;">
                Reset Password
              </a>
            </p>
            <p>Agar button work na kare to ye link open karo:</p>
            <p><a href="${resetLink}">${resetLink}</a></p>
            <p>Ye link 30 minutes mein expire ho jayega.</p>
          </div>
        `
      };

      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error: error.message };
    }
  }

  generateEmailHTML(booking, event, user) {
    const attendees = Array.isArray(booking.attendeeInfo)
      ? booking.attendeeInfo
      : (booking.attendeeInfo ? [booking.attendeeInfo] : []);
    const eventDate = new Date(event.dateTime.start).toLocaleDateString('en-IN');
    const eventTime = new Date(event.dateTime.start).toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Event Ticket</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #1976d2, #42a5f5); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .ticket-info { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #1976d2; }
          .highlight { color: #1976d2; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .button { display: inline-block; background: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎫 Your Event Ticket</h1>
            <p>Booking Confirmed Successfully!</p>
          </div>
          
          <div class="content">
            <h2>Hello ${user.name}!</h2>
            <p>Your booking for <span class="highlight">${event.title}</span> has been confirmed. Please find your ticket attached as a PDF.</p>
            
            <div class="ticket-info">
              <h3>📅 Event Details</h3>
              <p><strong>Event:</strong> ${event.title}</p>
              <p><strong>Date:</strong> ${eventDate}</p>
              <p><strong>Time:</strong> ${eventTime}</p>
              <p><strong>Venue:</strong> ${event.venue.name}</p>
              <p><strong>Address:</strong> ${event.venue.address.street || ''} ${event.venue.address.city}, ${event.venue.address.state || ''} ${event.venue.address.country}</p>
            </div>

            <div class="ticket-info">
              <h3>🎫 Booking Information</h3>
              <p><strong>Booking Reference:</strong> ${booking.bookingReference}</p>
              <p><strong>Total Amount:</strong> ₹${booking.totalAmount}</p>
              <p><strong>Payment Method:</strong> ${booking.paymentMethod.toUpperCase()}</p>
              <p><strong>Status:</strong> ${booking.status.toUpperCase()}</p>
            </div>

            <div class="ticket-info">
              <h3>👥 Attendee Information</h3>
              ${attendees.map((attendee, index) => `
                <p><strong>Attendee ${index + 1}:</strong> ${attendee.name || ''} (${attendee.email || ''})</p>
              `).join('')}
            </div>

            <div class="ticket-info">
              <h3>🎟️ Ticket Details</h3>
              ${booking.tickets.map((ticket, index) => `
                <p><strong>Ticket ${index + 1}:</strong> ${ticket.tier.name} x ${ticket.quantity} = ₹${ticket.tier.price * ticket.quantity}</p>
              `).join('')}
            </div>

            <p><strong>📎 Important:</strong> Your ticket is attached as a PDF. Please download and save it on your device. You can also take a screenshot for easy access.</p>
            
            <p><strong>📱 At the Event:</strong> Please bring this ticket (printed or on your phone) and a valid ID for entry.</p>

            <div class="footer">
              <p>Thank you for choosing EventHub!</p>
              <p>For any queries, contact us at support@eventhub.com</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateEmailText(booking, event, user) {
    const attendees = Array.isArray(booking.attendeeInfo)
      ? booking.attendeeInfo
      : (booking.attendeeInfo ? [booking.attendeeInfo] : []);
    const eventDate = new Date(event.dateTime.start).toLocaleDateString('en-IN');
    const eventTime = new Date(event.dateTime.start).toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return `
Hello ${user.name}!

Your booking for ${event.title} has been confirmed. Please find your ticket attached as a PDF.

EVENT DETAILS:
- Event: ${event.title}
- Date: ${eventDate}
- Time: ${eventTime}
- Venue: ${event.venue.name}
- Address: ${event.venue.address.street || ''} ${event.venue.address.city}, ${event.venue.address.state || ''} ${event.venue.address.country}

BOOKING INFORMATION:
- Booking Reference: ${booking.bookingReference}
- Total Amount: ₹${booking.totalAmount}
- Payment Method: ${booking.paymentMethod.toUpperCase()}
- Status: ${booking.status.toUpperCase()}

ATTENDEE INFORMATION:
${attendees.map((attendee, index) => 
  `- Attendee ${index + 1}: ${attendee.name || ''} (${attendee.email || ''})`
).join('\n')}

TICKET DETAILS:
${booking.tickets.map((ticket, index) => 
  `- Ticket ${index + 1}: ${ticket.tier.name} x ${ticket.quantity} = ₹${ticket.tier.price * ticket.quantity}`
).join('\n')}

IMPORTANT:
- Your ticket is attached as a PDF. Please download and save it.
- Please bring this ticket (printed or on your phone) and a valid ID for entry.

Thank you for choosing EventHub!
For any queries, contact us at support@eventhub.com

This is an automated email. Please do not reply.
    `;
  }

  // Test email function
  async sendTestEmail(toEmail) {
    try {
      const mailOptions = {
        from: {
          name: 'EventHub',
          address: process.env.EMAIL_USER
        },
        to: toEmail,
        subject: 'EventHub Email Test',
        html: '<h1>Email service is working!</h1><p>This is a test email from EventHub.</p>'
      };

      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
