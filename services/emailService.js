const nodemailer = require('nodemailer');
const pdfGenerator = require('./pdfGenerator');
require('dotenv').config();

const formatEventDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Date to be announced';
};

const formatEventTime = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Time to be announced';
};

const formatCurrency = (amount, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number(amount || 0));

const buildVenueAddress = (event) => {
  const address = event?.venue?.address || {};
  return [
    address.street,
    address.city,
    address.state,
    address.country,
  ]
    .filter(Boolean)
    .join(', ') || 'Venue details will be shared soon';
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getAttendees = (booking) =>
  Array.isArray(booking.attendeeInfo)
    ? booking.attendeeInfo
    : booking.attendeeInfo
      ? [booking.attendeeInfo]
      : [];

const getTickets = (booking) => (Array.isArray(booking.tickets) ? booking.tickets : []);

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Present' : 'Missing');

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log(
        'Email service is not configured. Set EMAIL_USER and EMAIL_PASS in the .env file.'
      );
      this.transporter = null;
      return;
    }

    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
      secure: false,
      port: 587,
    });

    this.transporter.verify((error, success) => {
      if (error) {
        console.error('Email service error:', error.message);
        console.log('Troubleshooting steps:');
        console.log('1. Enable 2-factor authentication on your email account.');
        console.log(
          '2. Generate an app password and use it in EMAIL_PASS.'
        );
        console.log('3. Verify EMAIL_USER is the full email address.');

        if (process.env.EMAIL_SERVICE === 'gmail' || !process.env.EMAIL_SERVICE) {
          console.log('Trying alternative Gmail configuration...');
          this.tryAlternativeGmailConfig();
        }
      } else {
        console.log('Email service ready:', success);
        console.log('Ticket emails will be sent to attendee email addresses.');
      }
    });
  }

  tryAlternativeGmailConfig() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3',
      },
    });

    this.transporter.verify((error, success) => {
      if (error) {
        console.error('Alternative Gmail config also failed:', error.message);
        console.log('Please verify the app password setup.');
      } else {
        console.log('Alternative Gmail configuration successful:', success);
      }
    });
  }

  async sendTicketEmail(booking, event, user) {
    try {
      if (!this.transporter) {
        console.log('Email service not configured. Skipping email send.');
        return {
          success: false,
          error: 'Email service not configured',
        };
      }

      const pdfResult = await pdfGenerator.generateTicketPDF(booking, event, user);
      const emailSubject = `Your Premium Event Pass - ${event?.title || 'EventHub Booking'}`;
      const emailHtml = this.generateEmailHTML(booking, event, user);
      const emailText = this.generateEmailText(booking, event, user);

      const mailOptions = {
        from: {
          name: 'EventHub',
          address: process.env.EMAIL_USER,
        },
        to: user.email,
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
        attachments: [
          {
            filename: pdfResult.fileName,
            path: pdfResult.filePath,
            contentType: 'application/pdf',
          },
        ],
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Ticket email sent successfully:', result.messageId);

      setTimeout(() => {
        try {
          require('fs').unlinkSync(pdfResult.filePath);
        } catch (error) {
          console.error('Error deleting PDF file:', error);
        }
      }, 5000);

      return {
        success: true,
        messageId: result.messageId,
        fileName: pdfResult.fileName,
      };
    } catch (error) {
      console.error('Error sending ticket email:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async sendPasswordResetEmail(user, resetLink) {
    try {
      if (!this.transporter) {
        console.log(
          'Password reset email skipped because transporter is not configured.'
        );
        return {
          success: false,
          error: 'Email service not configured',
        };
      }

      const mailOptions = {
        from: {
          name: 'EventHub',
          address: process.env.EMAIL_USER,
        },
        to: user.email,
        subject: 'EventHub Password Reset',
        text: `Hello ${user.name},\n\nUse this link to reset your password: ${resetLink}\n\nThis link expires in 30 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
            <h2 style="color: #4f46e5;">Reset Your Password</h2>
            <p>Hello ${escapeHtml(user.name)},</p>
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
        `,
      };

      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error: error.message };
    }
  }

  generateEmailHTML(booking, event, user) {
    const attendees = getAttendees(booking);
    const tickets = getTickets(booking);
    const eventTitle = escapeHtml(event?.title || 'Event Details Pending');
    const eventDate = escapeHtml(formatEventDate(event?.dateTime?.start));
    const eventTime = escapeHtml(formatEventTime(event?.dateTime?.start));
    const venueName = escapeHtml(event?.venue?.name || 'Venue To Be Announced');
    const venueAddress = escapeHtml(buildVenueAddress(event));
    const bookingReference = escapeHtml(booking.bookingReference || 'Pending');
    const customerName = escapeHtml(user?.name || 'Guest');
    const status = escapeHtml((booking.status || 'confirmed').toUpperCase());
    const paymentMethod = escapeHtml(
      String(booking.paymentMethod || 'online').toUpperCase()
    );
    const currency = event?.pricing?.currency || booking.currency || 'INR';
    const totalAmount = escapeHtml(formatCurrency(booking.totalAmount, currency));
    const ticketCount = tickets.reduce(
      (sum, ticket) => sum + Number(ticket.quantity || 0),
      0
    );

    const attendeeCards = attendees.length
      ? attendees
          .map(
            (attendee, index) => `
              <div class="detail-card attendee-card">
                <div class="card-kicker">Guest ${index + 1}</div>
                <div class="attendee-name">${escapeHtml(attendee.name || 'Guest')}</div>
                <div class="attendee-meta">${escapeHtml(attendee.email || 'Email unavailable')}</div>
                ${
                  attendee.phone
                    ? `<div class="attendee-meta">${escapeHtml(attendee.phone)}</div>`
                    : ''
                }
              </div>
            `
          )
          .join('')
      : `
        <div class="detail-card attendee-card">
          <div class="card-kicker">Primary Guest</div>
          <div class="attendee-name">${customerName}</div>
          <div class="attendee-meta">${escapeHtml(user?.email || 'Email unavailable')}</div>
        </div>
      `;

    const ticketCards = tickets
      .map((ticket, index) => {
        const quantity = Number(ticket.quantity || 0);
        const lineTotal = Number(ticket.tier?.price || 0) * quantity;

        return `
          <div class="line-item">
            <div>
              <div class="line-title">Pass ${index + 1}: ${escapeHtml(
                ticket.tier?.name || 'General Admission'
              )}</div>
              <div class="line-subtitle">${quantity} ticket${quantity === 1 ? '' : 's'} x ${escapeHtml(
                formatCurrency(ticket.tier?.price || 0, currency)
              )}</div>
            </div>
            <div class="line-amount">${escapeHtml(formatCurrency(lineTotal, currency))}</div>
          </div>
        `;
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Your EventHub Premium Pass</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              background: #081120;
              font-family: "Segoe UI", Arial, sans-serif;
              color: #e2e8f0;
            }
            .shell {
              width: 100%;
              padding: 32px 16px;
              background:
                radial-gradient(circle at top left, rgba(56, 189, 248, 0.18), transparent 30%),
                radial-gradient(circle at top right, rgba(244, 114, 182, 0.18), transparent 24%),
                linear-gradient(180deg, #081120 0%, #101826 100%);
            }
            .card {
              max-width: 700px;
              margin: 0 auto;
              background: #0f172a;
              border: 1px solid rgba(148, 163, 184, 0.18);
              border-radius: 28px;
              overflow: hidden;
              box-shadow: 0 24px 80px rgba(2, 6, 23, 0.45);
            }
            .hero {
              padding: 36px 36px 28px;
              background:
                radial-gradient(circle at 12% 20%, rgba(255, 255, 255, 0.18), transparent 16%),
                linear-gradient(135deg, #0f172a 0%, #1d4ed8 50%, #ec4899 100%);
            }
            .eyebrow {
              display: inline-block;
              padding: 8px 14px;
              border-radius: 999px;
              font-size: 12px;
              font-weight: 700;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: #f8fafc;
              background: rgba(255, 255, 255, 0.14);
            }
            .title {
              margin: 18px 0 10px;
              font-size: 34px;
              line-height: 1.08;
              font-weight: 800;
              color: #ffffff;
            }
            .subtitle {
              margin: 0;
              max-width: 520px;
              font-size: 16px;
              line-height: 1.7;
              color: rgba(255, 255, 255, 0.82);
            }
            .hero-grid {
              margin-top: 28px;
              font-size: 0;
            }
            .hero-stat {
              display: inline-block;
              width: calc(33.333% - 10px);
              margin-right: 15px;
              margin-bottom: 12px;
              padding: 16px;
              border-radius: 20px;
              background: rgba(255, 255, 255, 0.12);
              vertical-align: top;
              box-sizing: border-box;
            }
            .hero-stat:last-child {
              margin-right: 0;
            }
            .stat-label {
              font-size: 12px;
              font-weight: 700;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: rgba(255, 255, 255, 0.72);
            }
            .stat-value {
              margin-top: 10px;
              font-size: 20px;
              font-weight: 800;
              color: #ffffff;
            }
            .content {
              padding: 32px 36px 36px;
              background:
                linear-gradient(180deg, rgba(15, 23, 42, 0.96) 0%, rgba(8, 17, 32, 1) 100%);
            }
            .panel {
              margin-bottom: 24px;
              padding: 24px;
              border-radius: 24px;
              background: linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(17, 24, 39, 0.95) 100%);
              border: 1px solid rgba(148, 163, 184, 0.14);
            }
            .panel-title {
              margin: 0 0 18px;
              font-size: 20px;
              font-weight: 800;
              color: #f8fafc;
            }
            .greeting {
              margin: 0 0 22px;
              font-size: 16px;
              line-height: 1.75;
              color: #cbd5e1;
            }
            .detail-grid {
              font-size: 0;
            }
            .detail-card {
              display: inline-block;
              width: calc(50% - 8px);
              margin: 0 16px 16px 0;
              padding: 18px;
              border-radius: 20px;
              background: rgba(15, 23, 42, 0.72);
              border: 1px solid rgba(148, 163, 184, 0.14);
              box-sizing: border-box;
              vertical-align: top;
            }
            .detail-card:nth-child(2n) {
              margin-right: 0;
            }
            .card-kicker {
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: #7dd3fc;
            }
            .card-value {
              margin-top: 8px;
              font-size: 18px;
              font-weight: 700;
              color: #f8fafc;
            }
            .card-copy {
              margin-top: 6px;
              font-size: 14px;
              line-height: 1.7;
              color: #94a3b8;
            }
            .attendee-card {
              background: linear-gradient(180deg, rgba(30, 41, 59, 0.82) 0%, rgba(15, 23, 42, 0.92) 100%);
            }
            .attendee-name {
              margin-top: 8px;
              font-size: 18px;
              font-weight: 700;
              color: #ffffff;
            }
            .attendee-meta {
              margin-top: 6px;
              font-size: 14px;
              line-height: 1.6;
              color: #cbd5e1;
            }
            .line-item {
              display: table;
              width: 100%;
              padding: 16px 0;
              border-bottom: 1px solid rgba(148, 163, 184, 0.12);
            }
            .line-item:last-child {
              border-bottom: 0;
              padding-bottom: 0;
            }
            .line-title {
              font-size: 16px;
              font-weight: 700;
              color: #f8fafc;
            }
            .line-subtitle {
              margin-top: 6px;
              font-size: 14px;
              color: #94a3b8;
            }
            .line-amount {
              display: table-cell;
              text-align: right;
              vertical-align: middle;
              font-size: 18px;
              font-weight: 800;
              color: #ffffff;
            }
            .notes {
              margin: 0;
              padding-left: 18px;
              color: #cbd5e1;
            }
            .notes li {
              margin-bottom: 10px;
              line-height: 1.7;
            }
            .footer {
              padding: 0 36px 32px;
              text-align: center;
              color: #94a3b8;
              font-size: 13px;
              line-height: 1.7;
            }
            @media only screen and (max-width: 620px) {
              .hero,
              .content,
              .footer {
                padding-left: 20px !important;
                padding-right: 20px !important;
              }
              .hero-stat,
              .detail-card {
                width: 100% !important;
                margin-right: 0 !important;
              }
              .title {
                font-size: 28px !important;
              }
              .line-item,
              .line-amount {
                display: block !important;
                text-align: left !important;
              }
              .line-amount {
                margin-top: 10px;
              }
            }
          </style>
        </head>
        <body>
          <div class="shell">
            <div class="card">
              <div class="hero">
                <div class="eyebrow">EventHub Premium Pass</div>
                <h1 class="title">${eventTitle}</h1>
                <p class="subtitle">
                  Your booking is confirmed, your pass is attached, and your event night is ready.
                  Keep this email handy for a polished check-in experience.
                </p>

                <div class="hero-grid">
                  <div class="hero-stat">
                    <div class="stat-label">Booking Ref</div>
                    <div class="stat-value">${bookingReference}</div>
                  </div>
                  <div class="hero-stat">
                    <div class="stat-label">Status</div>
                    <div class="stat-value">${status}</div>
                  </div>
                  <div class="hero-stat">
                    <div class="stat-label">Total</div>
                    <div class="stat-value">${totalAmount}</div>
                  </div>
                </div>
              </div>

              <div class="content">
                <div class="panel">
                  <p class="greeting">
                    Hello ${customerName},<br />
                    Your premium pass for <strong>${eventTitle}</strong> is ready. The styled PDF ticket is attached with all entry details.
                  </p>

                  <div class="detail-grid">
                    <div class="detail-card">
                      <div class="card-kicker">Event Date</div>
                      <div class="card-value">${eventDate}</div>
                      <div class="card-copy">Arrive a little early for smoother access.</div>
                    </div>
                    <div class="detail-card">
                      <div class="card-kicker">Start Time</div>
                      <div class="card-value">${eventTime}</div>
                      <div class="card-copy">Doors and queue timings may vary by venue.</div>
                    </div>
                    <div class="detail-card">
                      <div class="card-kicker">Venue</div>
                      <div class="card-value">${venueName}</div>
                      <div class="card-copy">${venueAddress}</div>
                    </div>
                    <div class="detail-card">
                      <div class="card-kicker">Booking Summary</div>
                      <div class="card-value">${ticketCount} Pass${ticketCount === 1 ? '' : 'es'}</div>
                      <div class="card-copy">Paid via ${paymentMethod}</div>
                    </div>
                  </div>
                </div>

                <div class="panel">
                  <h2 class="panel-title">Guest List</h2>
                  <div class="detail-grid">
                    ${attendeeCards}
                  </div>
                </div>

                <div class="panel">
                  <h2 class="panel-title">Ticket Breakdown</h2>
                  ${ticketCards}
                </div>

                <div class="panel">
                  <h2 class="panel-title">Entry Notes</h2>
                  <ul class="notes">
                    <li>Carry the attached PDF pass on your phone or as a printout.</li>
                    <li>Bring a valid government ID that matches the booking details.</li>
                    <li>For help before the event, reply to your support channel or contact EventHub support.</li>
                  </ul>
                </div>
              </div>

              <div class="footer">
                Thank you for choosing EventHub.<br />
                Support: support@eventhub.com<br />
                This is an automated email, so direct replies may not be monitored.
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  generateEmailText(booking, event, user) {
    const attendees = getAttendees(booking);
    const tickets = getTickets(booking);
    const eventTitle = event?.title || 'Event Details Pending';
    const eventDate = formatEventDate(event?.dateTime?.start);
    const eventTime = formatEventTime(event?.dateTime?.start);
    const venueName = event?.venue?.name || 'Venue To Be Announced';
    const venueAddress = buildVenueAddress(event);
    const currency = event?.pricing?.currency || booking.currency || 'INR';

    return `
Hello ${user.name}!

Your premium pass for ${eventTitle} is ready. The styled PDF ticket is attached with this email.

EVENT DETAILS
- Event: ${eventTitle}
- Date: ${eventDate}
- Time: ${eventTime}
- Venue: ${venueName}
- Address: ${venueAddress}

BOOKING DETAILS
- Booking Reference: ${booking.bookingReference}
- Status: ${String(booking.status || 'confirmed').toUpperCase()}
- Payment Method: ${String(booking.paymentMethod || 'online').toUpperCase()}
- Total Amount: ${formatCurrency(booking.totalAmount, currency)}

ATTENDEES
${attendees.length
  ? attendees
      .map(
        (attendee, index) =>
          `- Guest ${index + 1}: ${attendee.name || 'Guest'} (${attendee.email || 'No email'})${
            attendee.phone ? `, ${attendee.phone}` : ''
          }`
      )
      .join('\n')
  : `- ${user.name} (${user.email})`}

TICKET BREAKDOWN
${tickets
  .map((ticket, index) => {
    const quantity = Number(ticket.quantity || 0);
    const lineTotal = Number(ticket.tier?.price || 0) * quantity;
    return `- Pass ${index + 1}: ${ticket.tier?.name || 'General Admission'} x ${quantity} = ${formatCurrency(lineTotal, currency)}`;
  })
  .join('\n')}

ENTRY NOTES
- Carry the attached PDF pass on your phone or as a printout.
- Bring a valid government ID for entry.
- For assistance, contact support@eventhub.com.

Thank you for choosing EventHub.
    `;
  }

  async sendTestEmail(toEmail) {
    try {
      const mailOptions = {
        from: {
          name: 'EventHub',
          address: process.env.EMAIL_USER,
        },
        to: toEmail,
        subject: 'EventHub Email Test',
        html: '<h1>Email service is working!</h1><p>This is a test email from EventHub.</p>',
      };

      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
