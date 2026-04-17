# Email Configuration Guide

The receipt email functionality is now fully integrated! Follow these steps to enable it.

## Option 1: Gmail (Recommended for Testing)

### Step 1: Enable 2-Factor Authentication
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click **Security** in the left menu
3. Enable **2-Step Verification** if not already enabled

### Step 2: Generate App Password
1. Go back to **Security** page
2. Find **App passwords** (appears only if 2FA is enabled)
3. Select **Mail** and **Windows Computer** (or your device)
4. Click **Generate**
5. Copy the 16-character password

### Step 3: Configure .env
Update `/backend/.env`:
```env
EMAIL_SERVICE=gmail
EMAIL_FROM=your_email@gmail.com
EMAIL_PASSWORD=your_16_char_app_password_here
```

## Option 2: Custom SMTP Server

Update `/backend/.env`:
```env
EMAIL_SMTP_HOST=smtp.your-provider.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=your_email@provider.com
EMAIL_SMTP_PASSWORD=your_password
EMAIL_SMTP_SECURE=false
EMAIL_FROM=your_email@provider.com
```

## Step 4: Restart Backend

```bash
cd backend
npm start
# or
npm run dev
```

You should see one of these messages:
- ✅ `Email configured with gmail`
- ✅ `Email configured with custom SMTP`

## Testing

1. Open the web app: http://localhost:3000
2. Log in with your PIN
3. Complete a sale (add items to cart → Click Payment → Complete Sale)
4. Click the **📧 Email** button on the receipt modal
5. Enter a test email address
6. Check that email in your inbox!

## How It Works

1. **Customer completes a sale** → Receipt is generated
2. **User clicks Email button** → Prompted for email address
3. **Backend validates email** and generates professional HTML receipt
4. **Nodemailer sends via configured SMTP** → Recipient gets formatted receipt
5. **Toast notification** shows confirmation

## Features

- ✅ Professional HTML formatted receipts
- ✅ Transaction details (date, items, total, payment method)
- ✅ Business name included
- ✅ Error handling for misconfigured email
- ✅ Real-time feedback to user
- ✅ Works with any SMTP provider

## Troubleshooting

### "Email service is not configured"
Make sure you've set up either:
- `EMAIL_SERVICE`, `EMAIL_FROM`, `EMAIL_PASSWORD` (for Gmail/Office365/etc)
- OR `EMAIL_SMTP_HOST`, `EMAIL_SMTP_PORT`, `EMAIL_SMTP_USER`, `EMAIL_SMTP_PASSWORD`

Then restart the backend server.

### "Failed to send email"
1. Check your email credentials are correct
2. For Gmail: Verify you generated an App Password (not your regular password)
3. Check that 2FA is enabled on Gmail
4. Some SMTP servers may require `EMAIL_SMTP_SECURE=true`

### "Invalid email address format"
Make sure the email entered contains an `@` symbol and a domain (e.g., user@example.com)

## Common Email Providers

| Provider | Service Name | Notes |
|----------|-------------|-------|
| Gmail | `gmail` | Requires App Password |
| Office 365 | `office365` | Uses SMTP host: smtp.office365.com |
| Outlook | `outlook` | Uses SMTP host: smtp-mail.outlook.com |
| SendGrid | Custom SMTP | SMTP host: smtp.sendgrid.net, Port: 587 |
| AWS SES | Custom SMTP | SMTP host: email-smtp.region.amazonaws.com |

## Production Deployment

For production, consider:
1. Using environment variables from your hosting provider
2. Using a dedicated email service like SendGrid or Mailgun
3. Adding email templates for branding
4. Logging email sends to database for records
5. Implementing email retry logic for failed sends
