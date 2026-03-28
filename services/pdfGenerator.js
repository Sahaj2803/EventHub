const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const PAGE_MARGIN = 36;
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const CARD_GAP = 16;

const COLORS = {
  ink: '#0f172a',
  inkMuted: '#475569',
  paper: '#f8fafc',
  border: '#dbe4f0',
  accent: '#2563eb',
  accentSoft: '#dbeafe',
  accentStrong: '#1d4ed8',
  premium: '#f59e0b',
  premiumSoft: '#fff7ed',
  success: '#16a34a',
  white: '#ffffff',
  slateDark: '#111827',
};

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

const getAttendees = (booking) =>
  Array.isArray(booking.attendeeInfo)
    ? booking.attendeeInfo
    : booking.attendeeInfo
      ? [booking.attendeeInfo]
      : [];

const getTickets = (booking) => (Array.isArray(booking.tickets) ? booking.tickets : []);

const drawRoundedCard = (doc, x, y, width, height, fill, stroke) => {
  doc.save();
  doc.roundedRect(x, y, width, height, 18).fill(fill);
  doc.restore();
  doc.save();
  doc.lineWidth(1).strokeColor(stroke).roundedRect(x, y, width, height, 18).stroke();
  doc.restore();
};

const drawPill = (doc, x, y, label, fillColor, textColor, width = null) => {
  const text = String(label || '').toUpperCase();
  doc.font('Helvetica-Bold').fontSize(9);
  const pillWidth = width || doc.widthOfString(text) + 22;
  drawRoundedCard(doc, x, y, pillWidth, 24, fillColor, fillColor);
  doc
    .fillColor(textColor)
    .text(text, x, y + 8, {
      width: pillWidth,
      align: 'center',
    });
  return pillWidth;
};

const drawSectionHeading = (doc, y, title, subtitle) => {
  doc
    .font('Helvetica-Bold')
    .fontSize(16)
    .fillColor(COLORS.ink)
    .text(title, PAGE_MARGIN, y);

  if (subtitle) {
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(COLORS.inkMuted)
      .text(subtitle, PAGE_MARGIN, y + 20);
    return y + 38;
  }

  return y + 24;
};

const drawInfoCard = (doc, x, y, width, label, value, copy) => {
  drawRoundedCard(doc, x, y, width, 96, COLORS.paper, COLORS.border);

  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(COLORS.accentStrong)
    .text(label.toUpperCase(), x + 16, y + 14, {
      width: width - 32,
    });

  doc
    .font('Helvetica-Bold')
    .fontSize(17)
    .fillColor(COLORS.ink)
    .text(value, x + 16, y + 32, {
      width: width - 32,
    });

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor(COLORS.inkMuted)
    .text(copy, x + 16, y + 60, {
      width: width - 32,
    });
};

const drawContinuationHeader = (doc, eventTitle, bookingReference) => {
  drawRoundedCard(
    doc,
    PAGE_MARGIN,
    PAGE_MARGIN,
    CONTENT_WIDTH,
    74,
    COLORS.slateDark,
    COLORS.slateDark
  );

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor('#93c5fd')
    .text('EVENTHUB PREMIUM PASS', PAGE_MARGIN + 18, PAGE_MARGIN + 16);

  doc
    .font('Helvetica-Bold')
    .fontSize(19)
    .fillColor(COLORS.white)
    .text(eventTitle, PAGE_MARGIN + 18, PAGE_MARGIN + 30, {
      width: CONTENT_WIDTH - 170,
    });

  drawPill(
    doc,
    PAGE_MARGIN + CONTENT_WIDTH - 138,
    PAGE_MARGIN + 24,
    bookingReference,
    COLORS.accent,
    COLORS.white,
    120
  );

  return PAGE_MARGIN + 96;
};

const ensureSpace = (doc, y, requiredHeight, eventTitle, bookingReference) => {
  if (y + requiredHeight <= PAGE_HEIGHT - PAGE_MARGIN) {
    return y;
  }

  doc.addPage();
  return drawContinuationHeader(doc, eventTitle, bookingReference);
};

class PDFGenerator {
  constructor() {
    this.outputDir = path.join(__dirname, '../uploads/tickets');
    this.ensureOutputDir();
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateTicketPDF(booking, event, user) {
    const eventTitle = event?.title || 'Event Details Pending';
    const venueName = event?.venue?.name || 'Venue To Be Announced';
    const venueAddress = buildVenueAddress(event);
    const eventDate = formatEventDate(event?.dateTime?.start);
    const eventTime = formatEventTime(event?.dateTime?.start);
    const categoryName = event?.category?.name || 'General';
    const bookingReference = booking.bookingReference || 'Pending';
    const currency = event?.pricing?.currency || booking.currency || 'INR';
    const attendees = getAttendees(booking);
    const tickets = getTickets(booking);
    const ticketCount = tickets.reduce(
      (sum, ticket) => sum + Number(ticket.quantity || 0),
      0
    );
    const primaryGuest = attendees[0]?.name || user?.name || 'Guest';
    const qrPayload = {
      bookingReference,
      eventId: String(event?._id || booking.event || ''),
      userId: String(booking.user?._id || booking.user || ''),
      totalAmount: booking.totalAmount,
      status: booking.status,
    };

    const fileName = `ticket-${bookingReference}-${Date.now()}.pdf`;
    const filePath = path.join(this.outputDir, fileName);
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      info: {
        Title: `${eventTitle} Premium Pass`,
        Author: 'EventHub',
      },
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const qrDataUrl = await QRCode.toDataURL(JSON.stringify(qrPayload), {
      margin: 1,
      width: 240,
      color: {
        dark: '#0f172a',
        light: '#FFFFFF',
      },
    });
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

    doc.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill('#f3f6fb');

    drawRoundedCard(
      doc,
      PAGE_MARGIN,
      28,
      CONTENT_WIDTH,
      210,
      COLORS.slateDark,
      COLORS.slateDark
    );

    doc
      .save()
      .fillColor('#1d4ed8')
      .roundedRect(PAGE_MARGIN, 28, CONTENT_WIDTH, 210, 18)
      .fillOpacity(0.18)
      .fill()
      .restore();

    doc
      .save()
      .fillColor('#ec4899')
      .circle(PAGE_MARGIN + CONTENT_WIDTH - 64, 76, 46)
      .fillOpacity(0.16)
      .fill()
      .restore();

    doc
      .save()
      .fillColor('#38bdf8')
      .circle(PAGE_MARGIN + 78, 58, 32)
      .fillOpacity(0.14)
      .fill()
      .restore();

    drawPill(
      doc,
      PAGE_MARGIN + 24,
      48,
      'EventHub Premium Pass',
      '#334155',
      COLORS.white,
      154
    );

    doc
      .font('Helvetica-Bold')
      .fontSize(27)
      .fillColor(COLORS.white)
      .text(eventTitle, PAGE_MARGIN + 24, 86, {
        width: CONTENT_WIDTH - 220,
        lineGap: 2,
      });

    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor('#cbd5e1')
      .text(
        'Curated access pass for a polished entry experience. Keep this ticket ready at the venue.',
        PAGE_MARGIN + 24,
        138,
        {
          width: CONTENT_WIDTH - 240,
          lineGap: 3,
        }
      );

    const heroStatsY = 182;
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#93c5fd')
      .text('BOOKING REF', PAGE_MARGIN + 24, heroStatsY);
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor(COLORS.white)
      .text(bookingReference, PAGE_MARGIN + 24, heroStatsY + 14);

    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#93c5fd')
      .text('PRIMARY GUEST', PAGE_MARGIN + 176, heroStatsY);
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor(COLORS.white)
      .text(primaryGuest, PAGE_MARGIN + 176, heroStatsY + 14, {
        width: 120,
      });

    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor('#93c5fd')
      .text('TOTAL PAID', PAGE_MARGIN + 324, heroStatsY);
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor(COLORS.white)
      .text(formatCurrency(booking.totalAmount, currency), PAGE_MARGIN + 324, heroStatsY + 14);

    drawRoundedCard(doc, PAGE_MARGIN + CONTENT_WIDTH - 154, 48, 126, 150, COLORS.white, COLORS.white);
    doc.image(qrBuffer, PAGE_MARGIN + CONTENT_WIDTH - 142, 60, {
      fit: [102, 102],
      align: 'center',
      valign: 'center',
    });
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(COLORS.inkMuted)
      .text('Scan at check-in', PAGE_MARGIN + CONTENT_WIDTH - 146, 170, {
        width: 110,
        align: 'center',
      });

    let y = 264;
    y = drawSectionHeading(
      doc,
      y,
      'Event Essentials',
      'Everything your guest needs for a smooth arrival.'
    );

    const cardWidth = (CONTENT_WIDTH - CARD_GAP) / 2;
    drawInfoCard(doc, PAGE_MARGIN, y, cardWidth, 'Event Date', eventDate, 'Please arrive a little early.');
    drawInfoCard(
      doc,
      PAGE_MARGIN + cardWidth + CARD_GAP,
      y,
      cardWidth,
      'Start Time',
      eventTime,
      'Venue timings can vary by event.'
    );
    y += 112;

    drawInfoCard(doc, PAGE_MARGIN, y, cardWidth, 'Venue', venueName, venueAddress);
    drawInfoCard(
      doc,
      PAGE_MARGIN + cardWidth + CARD_GAP,
      y,
      cardWidth,
      'Pass Summary',
      `${ticketCount} ticket${ticketCount === 1 ? '' : 's'}`,
      `${String(booking.paymentMethod || 'online').toUpperCase()} payment`
    );
    y += 126;

    y = ensureSpace(doc, y, 120, eventTitle, bookingReference);
    y = drawSectionHeading(
      doc,
      y,
      'Booking Snapshot',
      'Quick reference details for support and verification.'
    );

    drawRoundedCard(doc, PAGE_MARGIN, y, CONTENT_WIDTH, 92, COLORS.white, COLORS.border);
    const snapshotColWidth = CONTENT_WIDTH / 4;
    const snapshotItems = [
      ['Status', String(booking.status || 'confirmed').toUpperCase()],
      ['Payment', String(booking.paymentStatus || 'paid').toUpperCase()],
      ['Category', categoryName],
      ['Guest Count', String(attendees.length || 1)],
    ];

    snapshotItems.forEach(([label, value], index) => {
      const x = PAGE_MARGIN + index * snapshotColWidth;
      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor(COLORS.accentStrong)
        .text(label.toUpperCase(), x + 16, y + 18, {
          width: snapshotColWidth - 32,
          align: 'left',
        });
      doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .fillColor(COLORS.ink)
        .text(value, x + 16, y + 38, {
          width: snapshotColWidth - 32,
        });
    });
    y += 116;

    y = ensureSpace(doc, y, 110, eventTitle, bookingReference);
    y = drawSectionHeading(
      doc,
      y,
      'Guest List',
      'Use these attendee details for check-in verification.'
    );

    const guests = attendees.length
      ? attendees
      : [{ name: user?.name || 'Guest', email: user?.email || '', phone: '' }];

    guests.forEach((attendee, index) => {
      const cardHeight = attendee.phone ? 88 : 74;
      y = ensureSpace(doc, y, cardHeight + 12, eventTitle, bookingReference);
      drawRoundedCard(doc, PAGE_MARGIN, y, CONTENT_WIDTH, cardHeight, COLORS.white, COLORS.border);

      drawPill(
        doc,
        PAGE_MARGIN + 18,
        y + 16,
        `Guest ${index + 1}`,
        COLORS.accentSoft,
        COLORS.accentStrong,
        76
      );

      doc
        .font('Helvetica-Bold')
        .fontSize(15)
        .fillColor(COLORS.ink)
        .text(attendee.name || 'Guest', PAGE_MARGIN + 18, y + 46, {
          width: 220,
        });

      doc
        .font('Helvetica')
        .fontSize(11)
        .fillColor(COLORS.inkMuted)
        .text(attendee.email || 'Email unavailable', PAGE_MARGIN + 250, y + 28, {
          width: CONTENT_WIDTH - 268,
        });

      if (attendee.phone) {
        doc
          .font('Helvetica')
          .fontSize(11)
          .fillColor(COLORS.inkMuted)
          .text(attendee.phone, PAGE_MARGIN + 250, y + 48, {
            width: CONTENT_WIDTH - 268,
          });
      }

      y += cardHeight + 12;
    });

    y += 10;
    y = ensureSpace(doc, y, 120, eventTitle, bookingReference);
    y = drawSectionHeading(
      doc,
      y,
      'Ticket Breakdown',
      'Pricing summary of every pass included in this booking.'
    );

    tickets.forEach((ticket, index) => {
      const quantity = Number(ticket.quantity || 0);
      const ticketPrice = Number(ticket.tier?.price || 0);
      const lineTotal = ticketPrice * quantity;
      y = ensureSpace(doc, y, 88, eventTitle, bookingReference);

      drawRoundedCard(doc, PAGE_MARGIN, y, CONTENT_WIDTH, 76, COLORS.premiumSoft, '#fcd9a8');
      drawPill(
        doc,
        PAGE_MARGIN + 18,
        y + 16,
        `Pass ${index + 1}`,
        '#fde68a',
        '#92400e',
        74
      );

      doc
        .font('Helvetica-Bold')
        .fontSize(15)
        .fillColor(COLORS.ink)
        .text(ticket.tier?.name || 'General Admission', PAGE_MARGIN + 18, y + 42, {
          width: 220,
        });

      doc
        .font('Helvetica')
        .fontSize(11)
        .fillColor(COLORS.inkMuted)
        .text(`${quantity} x ${formatCurrency(ticketPrice, currency)}`, PAGE_MARGIN + 260, y + 24, {
          width: 120,
          align: 'right',
        });

      doc
        .font('Helvetica-Bold')
        .fontSize(16)
        .fillColor(COLORS.ink)
        .text(formatCurrency(lineTotal, currency), PAGE_MARGIN + CONTENT_WIDTH - 144, y + 30, {
          width: 120,
          align: 'right',
        });

      y += 90;
    });

    y = ensureSpace(doc, y, 152, eventTitle, bookingReference);
    y = drawSectionHeading(
      doc,
      y,
      'Ready For Entry',
      'A few quick reminders before you head to the event.'
    );

    drawRoundedCard(doc, PAGE_MARGIN, y, CONTENT_WIDTH, 122, COLORS.white, COLORS.border);

    const notes = [
      'Carry this PDF on your phone or as a clear printout.',
      'Bring a valid government ID that matches the booking details.',
      'Scan the QR code at the venue entry desk for faster check-in.',
      'Need help? Contact support@eventhub.com before the event starts.',
    ];

    let noteY = y + 18;
    notes.forEach((note, index) => {
      drawPill(
        doc,
        PAGE_MARGIN + 18,
        noteY,
        `${index + 1}`,
        COLORS.accentSoft,
        COLORS.accentStrong,
        28
      );
      doc
        .font('Helvetica')
        .fontSize(11)
        .fillColor(COLORS.inkMuted)
        .text(note, PAGE_MARGIN + 56, noteY + 5, {
          width: CONTENT_WIDTH - 80,
        });
      noteY += 24;
    });
    y += 140;

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(COLORS.inkMuted)
      .text('Thank you for choosing EventHub.', PAGE_MARGIN, PAGE_HEIGHT - 52, {
        width: CONTENT_WIDTH,
        align: 'center',
      });
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#64748b')
      .text('This premium pass was generated automatically for your booking.', PAGE_MARGIN, PAGE_HEIGHT - 36, {
        width: CONTENT_WIDTH,
        align: 'center',
      });

    doc.end();

    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    return {
      fileName,
      filePath,
      fileSize: fs.statSync(filePath).size,
    };
  }

  cleanupOldFiles(maxAgeInHours = 24) {
    try {
      const files = fs.readdirSync(this.outputDir);
      const now = Date.now();
      const maxAge = maxAgeInHours * 60 * 60 * 1000;

      files.forEach((file) => {
        const filePath = path.join(this.outputDir, file);
        const stats = fs.statSync(filePath);

        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
        }
      });
    } catch (error) {
      console.error('Error cleaning up old PDF files:', error);
    }
  }
}

module.exports = new PDFGenerator();
