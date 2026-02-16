const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

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

  generateTicketPDF(booking, event, user) {
    return new Promise((resolve, reject) => {
      try {
        const fileName = `ticket-${booking.bookingReference}-${Date.now()}.pdf`;
        const filePath = path.join(this.outputDir, fileName);
        
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });

        // Pipe the PDF to a file
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Header
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .fillColor('#1976d2')
           .text('EVENT TICKET', 50, 50, { align: 'center' });

        // Event Title
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .fillColor('#000000')
           .text(event.title, 50, 100, { align: 'center' });

        // Booking Reference
        doc.fontSize(12)
           .font('Helvetica')
           .fillColor('#666666')
           .text(`Booking Reference: ${booking.bookingReference}`, 50, 140);

        // Event Details Section
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .fillColor('#1976d2')
           .text('Event Details', 50, 180);

        // Event Information
        const eventDetails = [
          `Date: ${new Date(event.dateTime.start).toLocaleDateString('en-IN')}`,
          `Time: ${new Date(event.dateTime.start).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`,
          `Venue: ${event.venue.name}`,
          `Address: ${event.venue.address.street || ''} ${event.venue.address.city}, ${event.venue.address.state || ''} ${event.venue.address.country}`,
          `Category: ${event.category?.name || 'General'}`
        ];

        let yPosition = 210;
        doc.fontSize(12)
           .font('Helvetica')
           .fillColor('#000000');

        eventDetails.forEach(detail => {
          doc.text(detail, 50, yPosition);
          yPosition += 20;
        });

        // Attendee Information Section
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .fillColor('#1976d2')
           .text('Attendee Information', 50, yPosition + 20);

        yPosition += 50;
        doc.fontSize(12)
           .font('Helvetica')
           .fillColor('#000000');

        const attendees = Array.isArray(booking.attendeeInfo)
          ? booking.attendeeInfo
          : (booking.attendeeInfo ? [booking.attendeeInfo] : []);

        attendees.forEach((attendee, index) => {
          doc.text(`Attendee ${index + 1}:`, 50, yPosition);
          doc.text(`  Name: ${attendee.name || ''}`, 70, yPosition + 15);
          doc.text(`  Email: ${attendee.email || ''}`, 70, yPosition + 30);
          if (attendee && attendee.phone) {
            doc.text(`  Phone: ${attendee.phone}`, 70, yPosition + 45);
          }
          yPosition += 60;
        });

        // Ticket Details Section
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .fillColor('#1976d2')
           .text('Ticket Details', 50, yPosition + 20);

        yPosition += 50;
        doc.fontSize(12)
           .font('Helvetica')
           .fillColor('#000000');

        booking.tickets.forEach((ticket, index) => {
          doc.text(`Ticket ${index + 1}:`, 50, yPosition);
          doc.text(`  Type: ${ticket.tier.name}`, 70, yPosition + 15);
          doc.text(`  Quantity: ${ticket.quantity}`, 70, yPosition + 30);
          doc.text(`  Price: ₹${ticket.tier.price} each`, 70, yPosition + 45);
          doc.text(`  Total: ₹${ticket.tier.price * ticket.quantity}`, 70, yPosition + 60);
          yPosition += 80;
        });

        // Payment Information
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .fillColor('#1976d2')
           .text('Payment Information', 50, yPosition + 20);

        yPosition += 50;
        doc.fontSize(12)
           .font('Helvetica')
           .fillColor('#000000');

        doc.text(`Total Amount: ₹${booking.totalAmount}`, 50, yPosition);
        doc.text(`Payment Method: ${booking.paymentMethod.toUpperCase()}`, 50, yPosition + 20);
        doc.text(`Payment Status: ${booking.paymentStatus.toUpperCase()}`, 50, yPosition + 40);
        doc.text(`Booking Status: ${booking.status.toUpperCase()}`, 50, yPosition + 60);

        // Footer
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#666666')
           .text('Thank you for your booking!', 50, yPosition + 100, { align: 'center' });
        
        doc.text('Please bring this ticket and a valid ID to the event.', 50, yPosition + 120, { align: 'center' });
        doc.text('For any queries, contact us at support@eventhub.com', 50, yPosition + 140, { align: 'center' });

        // QR Code (booking verification payload)
        const qrPayload = {
          bookingReference: booking.bookingReference,
          eventId: String(event._id || ''),
          userId: String(booking.user || ''),
          totalAmount: booking.totalAmount,
          status: booking.status
        };

        QRCode.toDataURL(JSON.stringify(qrPayload), { margin: 1, width: 220 }, (qrErr, dataUrl) => {
          if (!qrErr && dataUrl) {
            try {
              const base64 = dataUrl.split(',')[1];
              const qrBuffer = Buffer.from(base64, 'base64');
              doc.image(qrBuffer, 400, 50, { width: 120, height: 120 });
            } catch (imgErr) {
              console.error('QR image embed error:', imgErr);
            }
          } else if (qrErr) {
            console.error('QR generation error:', qrErr);
          }

          // Finalize the PDF after QR handling
          try {
            doc.end();
          } catch (endErr) {
            console.error('PDF end error:', endErr);
          }
        });

        // doc.end() is now called after QR generation above

        stream.on('finish', () => {
          resolve({
            fileName,
            filePath,
            fileSize: fs.statSync(filePath).size
          });
        });

        stream.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  // Clean up old PDF files (optional)
  cleanupOldFiles(maxAgeInHours = 24) {
    try {
      const files = fs.readdirSync(this.outputDir);
      const now = Date.now();
      const maxAge = maxAgeInHours * 60 * 60 * 1000;

      files.forEach(file => {
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
