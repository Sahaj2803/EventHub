// Email Setup Script
// Run this script to test email configuration

const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmailSetup() {
  console.log('🔧 Testing Email Configuration...\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('EMAIL_USER:', process.env.EMAIL_USER || 'Not set');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***' : 'Not set');
  console.log('');
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('❌ Email credentials not configured!');
    return;
  }
  
  // ✅ Production-safe transporter (no TLS bypass)
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // SSL/TLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  // Test connection + send email
  try {
    console.log('🔌 Testing email connection...');
    await transporter.verify();
    console.log('✅ Email service is ready!\n');
    
    console.log('📧 Sending test email...');
    const result = await transporter.sendMail({
      from: {
        name: 'EventHub',
        address: process.env.EMAIL_USER
      },
      to: process.env.EMAIL_USER, // send to yourself
      subject: 'EventHub Email Test',
      html: `
        <h1>🎉 Email Service Working!</h1>
        <p>Your EventHub email service is configured correctly.</p>
        <p><strong>Test Time:</strong> ${new Date().toLocaleString('en-IN')}</p>
      `
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('📧 Message ID:', result.messageId);
    console.log('📬 Check your inbox for the test email.\n');
    
  } catch (error) {
    console.log('❌ Email test failed:');
    console.log('Error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Double-check your Gmail App Password');
    console.log('2. Ensure 2-Step Verification is enabled on Gmail');
    console.log('3. App Password must be used, not your normal Gmail password');
    console.log('4. Try running again with stable internet');
  }
}

// Run the test
testEmailSetup();
