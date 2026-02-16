# Email Setup Guide for Event Web

## Gmail Setup (Recommended)

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification if not already enabled

### Step 2: Generate App Password
1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" as the app
3. Generate a new app password
4. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 3: Update .env File
```bash
EMAIL_SERVICE=gmail
EMAIL_USER=pmann0212@gmail.com
EMAIL_PASS=your-16-character-app-password-here
```

### Step 4: Test Email Service
Use the MCP tool to test:
```javascript
test_email_service({
  email: "test@example.com"
})
```

## Alternative Email Services

### Outlook/Hotmail
```bash
EMAIL_SERVICE=hotmail
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-app-password
```

### Custom SMTP
```bash
EMAIL_SERVICE=smtp
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-password
```

## Troubleshooting

### Common Issues:

1. **"self-signed certificate in certificate chain"**
   - ✅ Fixed in latest version with `rejectUnauthorized: false`

2. **"Invalid login"**
   - Make sure you're using App Password, not regular password
   - Check that 2FA is enabled

3. **"Less secure app access"**
   - Use App Passwords instead of enabling less secure apps

4. **"Connection timeout"**
   - Check your internet connection
   - Try port 465 with `secure: true`

### Test Commands:

```bash
# Test email service via API
curl -X POST http://localhost:5005/api/bookings/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Check server logs for email service status
npm start
```

## Security Notes

- Never commit your .env file to version control
- Use App Passwords instead of your main password
- Regularly rotate your App Passwords
- Keep your email credentials secure

## Support

If you're still having issues:
1. Check the server console for detailed error messages
2. Verify your Gmail App Password is correct
3. Test with a simple email client first
4. Contact support with the specific error message
