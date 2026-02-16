# 📧 Email Ticket System Setup Guide

## Overview
Ye system automatically user ko booking ke baad email mein PDF ticket bhejta hai. User ko sirf booking karni hai, ticket automatically email mein aa jayega!

## 🚀 Features

✅ **Automatic Email**: Booking ke baad automatically email bhejta hai
✅ **PDF Ticket**: Professional PDF ticket generate karta hai
✅ **Beautiful Email**: HTML email template with all details
✅ **Multiple Email Services**: Gmail, Outlook, Yahoo support
✅ **Error Handling**: Proper error handling aur logging
✅ **File Cleanup**: Temporary PDF files automatically delete ho jate hain

## 📋 Setup Instructions

### 1. Environment Variables Setup

Apne `.env` file mein ye variables add karo:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 2. Gmail Setup (Recommended)

**Step 1**: Gmail account mein 2-factor authentication enable karo
**Step 2**: Google Account settings > Security > App passwords
**Step 3**: "Mail" ke liye new app password generate karo
**Step 4**: Us password ko `EMAIL_PASS` mein use karo

### 3. Other Email Services

#### Outlook/Hotmail:
```env
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-app-password
```

#### Yahoo:
```env
EMAIL_SERVICE=yahoo
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
```

#### Custom SMTP:
```env
EMAIL_SERVICE=smtp
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-password
EMAIL_HOST=smtp.your-domain.com
EMAIL_PORT=587
```

## 🎫 How It Works

1. **User books event** → Booking create hoti hai
2. **PDF Generation** → Professional ticket PDF banata hai
3. **Email Sending** → User ko email bhejta hai with PDF attachment
4. **File Cleanup** → Temporary PDF files delete ho jate hain

## 📧 Email Content

Email mein ye sab kuch hota hai:

- **Event Details**: Date, time, venue, address
- **Booking Information**: Reference number, amount, payment method
- **Attendee Information**: Names, emails, phone numbers
- **Ticket Details**: Ticket types, quantities, prices
- **PDF Attachment**: Downloadable ticket PDF
- **Instructions**: Event mein kya lana hai

## 🧪 Testing

### Test Email Service:
```bash
POST /api/bookings/test-email
{
  "email": "test@example.com"
}
```

### Check Email Logs:
Server console mein email sending ke logs dekho:
```
Ticket email sent successfully: <message-id>
```

## 🔧 Troubleshooting

### Common Issues:

1. **"Email service error"**
   - Check EMAIL_USER aur EMAIL_PASS
   - Make sure app password correct hai

2. **"Failed to send ticket email"**
   - Check internet connection
   - Verify email service settings

3. **PDF not generating**
   - Check uploads/tickets directory exists
   - Verify file permissions

### Debug Mode:
Server console mein detailed logs dekho:
```javascript
console.log('Email service ready:', success);
console.log('Ticket email sent successfully:', result.messageId);
```

## 📁 File Structure

```
services/
├── emailService.js      # Email sending logic
├── pdfGenerator.js     # PDF ticket generation
config/
├── emailConfig.js      # Email configuration
uploads/
├── tickets/           # Temporary PDF files
```

## 🎯 Usage Example

```javascript
// Automatic email sending after booking
emailService.sendTicketEmail(booking, event, user)
  .then(result => {
    if (result.success) {
      console.log('Email sent:', result.messageId);
    }
  });
```

## 🔒 Security Notes

- App passwords use karo, regular passwords nahi
- Environment variables secure rakho
- Email credentials .env file mein store karo
- Temporary PDF files automatically delete ho jate hain

## 📞 Support

Agar koi issue hai to:
1. Server logs check karo
2. Email service test karo
3. Environment variables verify karo
4. Internet connection check karo

---

**Happy Email Sending! 📧🎫**
