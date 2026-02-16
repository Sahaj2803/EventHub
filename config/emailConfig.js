// Email Configuration
// Copy this to your .env file or set these environment variables

module.exports = {
  // Email service configuration
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  },

  // Instructions for setting up email:
  setupInstructions: {
    gmail: `
      For Gmail setup:
      1. Enable 2-factor authentication on your Google account
      2. Go to Google Account settings > Security > App passwords
      3. Generate a new app password for "Mail"
      4. Use your Gmail address in EMAIL_USER
      5. Use the generated app password in EMAIL_PASS
    `,
    
    outlook: `
      For Outlook setup:
      1. Enable 2-factor authentication
      2. Generate an app password
      3. Use your Outlook email in EMAIL_USER
      4. Use the app password in EMAIL_PASS
    `,
    
    custom: `
      For custom SMTP:
      Set EMAIL_SERVICE=smtp and add:
      EMAIL_HOST=your-smtp-server.com
      EMAIL_PORT=587
      EMAIL_SECURE=false
    `
  }
};

// Example .env file content:
const exampleEnv = `
# Database
MONGODB_URI=mongodb://localhost:27017/eventmanagement

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Server Port
PORT=5001

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
`;

console.log('Email configuration loaded. Make sure to set up your .env file with the email credentials.');
