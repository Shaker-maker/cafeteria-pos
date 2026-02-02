# Chafua POS System - Complete Setup Guide

## 📚 Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [System Requirements](#system-requirements)
4. [Quick Start](#quick-start)
5. [M-Pesa Integration Setup](#mpesa-integration-setup)
6. [Deployment Options](#deployment-options)
7. [How to Use](#how-to-use)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The Chafua POS System is a modern, mobile-friendly Point of Sale application designed specifically for school cafeterias. It eliminates manual record-keeping by automating the entire sales process from M-Pesa payment to reporting.

### Current Problem:
1. Student pays via M-Pesa
2. Vendor checks phone message
3. Vendor writes in book
4. Vendor deletes message
5. Vendor takes photo of book
6. Owner re-enters data into Excel

### Our Solution:
1. Student pays via M-Pesa
2. Payment appears automatically in app
3. Vendor clicks items → Sale recorded
4. Owner sees real-time dashboard
5. Export to Excel with one click

---

## Features

### ✅ Vendor Features
- **Automatic M-Pesa Payment Detection** - Payments appear automatically, no message deletion needed
- **Quick Item Selection** - Tap-based menu for fast order entry
- **Shopping Cart** - Add multiple items, adjust quantities
- **Offline Mode** - Works without internet, syncs when connection returns
- **Payment Matching** - Link sales to specific M-Pesa transactions

### 📊 Owner Features
- **Real-time Dashboard** - See today's sales, total transactions, average order
- **Sales History** - Complete transaction log with filtering
- **Excel Export** - One-click download of all sales data
- **Top Items Report** - See which menu items are most popular
- **Remote Access** - Check sales from anywhere with internet

### 🔒 Technical Features
- **Offline-first** - Works without internet connection
- **Local Storage** - Data saved on device
- **Cloud Sync** - Optionally sync to server
- **Mobile Responsive** - Works on phones, tablets, computers
- **No App Store** - Works in web browser (Progressive Web App)

---

## System Requirements

### Minimum Requirements:
- Any smartphone or computer with a web browser (Chrome, Firefox, Safari)
- Internet connection (for M-Pesa integration and cloud sync)
- M-Pesa Till or Paybill number

### Recommended:
- Android tablet or iPad for vendor use
- Computer for owner dashboard
- Stable 3G/4G connection or WiFi

---

## Quick Start

### Option 1: Run Locally (No Server Needed)

This is the simplest way to start using the system immediately:

1. **Open the HTML file**
   - Download `index.html` from the frontend folder
   - Double-click to open in your browser
   - Start using immediately!

2. **Data Storage**
   - All data saved in browser (localStorage)
   - Works offline automatically
   - Export to Excel anytime

**Pros:** 
- No setup needed
- Works immediately
- Free
- No internet required

**Cons:**
- Data only on one device
- Manual M-Pesa entry (paste transaction IDs)
- No automatic sync between devices

---

### Option 2: Full Server Setup (Recommended for Production)

This gives you automatic M-Pesa integration and multi-device sync:

#### Step 1: Install Node.js
```bash
# Download from https://nodejs.org (LTS version)
# Or use package manager:

# Ubuntu/Debian
sudo apt update
sudo apt install nodejs npm

# macOS (with Homebrew)
brew install node

# Windows
# Download installer from nodejs.org
```

#### Step 2: Setup Backend
```bash
# Navigate to backend folder
cd cafeteria-pos/backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your M-Pesa credentials (see M-Pesa Integration section)
nano .env  # or use any text editor
```

#### Step 3: Start the Server
```bash
# Development mode (auto-restart on changes)
npm run dev

# Production mode
npm start
```

The server will start at `http://localhost:3000`

#### Step 4: Access the Application
- Open browser and go to `http://localhost:3000`
- For mobile access on same WiFi: `http://YOUR_COMPUTER_IP:3000`
- Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

---

## M-Pesa Integration Setup

### Getting M-Pesa API Credentials

#### Step 1: Create Safaricom Developer Account
1. Go to https://developer.safaricom.co.ke
2. Click "Sign Up" and create account
3. Verify your email

#### Step 2: Create an App
1. Login to developer portal
2. Click "My Apps" → "Create New App"
3. Fill in app details:
   - App Name: "Chafua POS"
   - Description: "School cafeteria sales system"
4. Select "Lipa Na M-Pesa Online" and "C2B" APIs
5. Click "Create App"

#### Step 3: Get Credentials
After creating app, you'll receive:
- **Consumer Key** - Copy this
- **Consumer Secret** - Copy this

#### Step 4: Configure C2B (Customer to Business)
1. In developer portal, go to your app
2. Click "C2B" API
3. Note your **Shortcode** (Till number or Paybill)
4. Get your **Passkey** from the portal

#### Step 5: Add Credentials to .env File
```bash
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here
MPESA_SHORTCODE=your_till_number
MPESA_PASSKEY=your_passkey_here
MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback
```

### Testing with Sandbox

Safaricom provides test credentials:
- Use sandbox URL: `https://sandbox.safaricom.co.ke`
- Test till number: `174379`
- Use test phone numbers from developer portal

### Going to Production

When ready for real transactions:
1. Submit app for production approval
2. Get production credentials
3. Update .env with production keys
4. Change API URLs from sandbox to production
5. Test thoroughly before going live!

---

## Deployment Options

### Option 1: Free Hosting (Render.com)

Perfect for small to medium cafeterias:

1. **Create account** at https://render.com
2. **Connect your code** (upload to GitHub first)
3. **Create Web Service**:
   - Build Command: `cd backend && npm install`
   - Start Command: `npm start`
   - Environment: Add all .env variables
4. **Deploy** - Takes ~5 minutes
5. **Get URL** - Your app will be at `https://your-app-name.onrender.com`

**Cost:** Free (with limitations) or $7/month for always-on

---

### Option 2: Heroku

1. Create Heroku account
2. Install Heroku CLI
3. Deploy:
```bash
heroku create chafua-pos
git push heroku main
heroku config:set MPESA_CONSUMER_KEY=your_key
heroku config:set MPESA_CONSUMER_SECRET=your_secret
```

**Cost:** $5-7/month for basic plan

---

### Option 3: Local Server (School Computer)

If you have a dedicated computer at school:

1. **Install Node.js** on the computer
2. **Setup auto-start**:
   - Windows: Use Task Scheduler
   - Linux: Use systemd service
   - macOS: Use launchd

3. **Configure local network**:
   - Connect computer to school WiFi
   - Note the computer's IP address
   - Access from any device: `http://COMPUTER_IP:3000`

**Cost:** Free (uses existing computer)
**Pros:** Full control, no monthly fees
**Cons:** Requires always-on computer, manual backups

---

### Option 4: Mobile-Only (No Server)

For simplest setup:

1. Install the HTML file on tablet/phone
2. Save to home screen as web app
3. Use offline mode
4. Export data to Excel daily/weekly

**Cost:** Free
**Pros:** Zero setup, works immediately
**Cons:** Manual M-Pesa entry, single device only

---

## How to Use

### For Vendors (Daily Use)

#### Starting the Day:
1. Open the app on your phone/tablet
2. You'll see "Vendor View" by default
3. Recent M-Pesa payments appear automatically

#### Making a Sale:
1. **Student pays** via M-Pesa to your till number
2. **Payment appears** in "Recent M-Pesa Payments" section
3. **Click the payment** to select it (turns blue)
4. **Click menu items** student ordered (e.g., Chapati, Beans, Tea)
5. Items appear in cart - adjust quantities if needed
6. **Click "Complete Sale"** button
7. Sale recorded! Payment marked as matched (green checkmark)

#### If Cash Payment:
1. Click menu items as normal
2. Don't select any M-Pesa payment
3. Click "Complete Sale"
4. Will be recorded as "CASH" transaction

#### Fixing Mistakes:
- Click "Clear" button to empty cart
- Click "-" button next to items to reduce quantity
- Click item name multiple times to add more

---

### For Owners (Dashboard)

#### Viewing Today's Performance:
1. Click "Owner Dashboard" button
2. See at a glance:
   - Total sales today (KES)
   - Number of transactions
   - Average order value
   - Most popular item

#### Checking Sales History:
1. Scroll down to "Sales History" table
2. See all transactions with:
   - Time of sale
   - M-Pesa transaction ID
   - Items sold
   - Amount
   - Status

#### Exporting to Excel:
1. Click "Export Excel" button
2. File downloads automatically
3. Open in Excel, Google Sheets, etc.
4. Contains all sales data

#### Refreshing Data:
- Click "Refresh" button to update dashboard
- Happens automatically every 30 seconds

---

## Troubleshooting

### M-Pesa Payments Not Appearing

**Problem:** Payments don't show up automatically

**Solutions:**
1. Check internet connection
2. Verify M-Pesa credentials in .env file
3. Check if callback URL is accessible (use ngrok for local testing)
4. Look at server logs for errors
5. Manually enter transaction ID if needed

---

### "Offline Mode" Message Showing

**Problem:** Red banner says "Offline Mode"

**Solutions:**
1. This is normal - app still works!
2. Sales are saved locally
3. Will sync when connection returns
4. Export to Excel to backup data

---

### Can't Access from Other Devices

**Problem:** App works on server computer but not on phones

**Solutions:**
1. Check all devices on same WiFi network
2. Find server computer's IP address
3. Use IP address, not "localhost": `http://192.168.1.X:3000`
4. Disable firewall temporarily to test
5. For permanent fix, allow port 3000 through firewall

---

### Data Lost After Closing Browser

**Problem:** Sales disappear when closing app

**Solutions:**
1. If using local HTML file, data saves in browser localStorage
2. Don't clear browser data/cookies
3. Use server version for persistent storage
4. Export to Excel regularly as backup

---

### M-Pesa API Errors

**Error:** "Invalid access token"
- Check consumer key and secret are correct
- Ensure using correct sandbox/production URLs
- Token expires after 1 hour - app should auto-refresh

**Error:** "Invalid shortcode"
- Verify shortcode in .env matches your till/paybill
- Check if using sandbox vs production shortcode

**Error:** "Callback URL not accessible"
- Your server must be publicly accessible
- Use ngrok for local testing: `ngrok http 3000`
- Update callback URL in .env and developer portal

---

## Advanced Features

### Adding New Menu Items

Via Owner Dashboard:
1. Open developer console (F12)
2. Use API: `POST /api/menu` with `{name: "Item", price: 50}`

Or edit database directly:
```sql
INSERT INTO menu_items (name, price) VALUES ('New Item', 100);
```

### Customizing Appearance

Edit `frontend/index.html`:
- Change colors in `<style>` section
- Modify `linear-gradient` for header colors
- Update button colors (.btn-primary, etc.)

### Backing Up Data

**Database backup:**
```bash
# Copy cafeteria.db file to safe location
cp backend/cafeteria.db ~/backups/cafeteria-$(date +%Y%m%d).db
```

**Automated backups:**
Add to crontab (Linux/Mac):
```bash
# Daily backup at midnight
0 0 * * * cp /path/to/cafeteria.db /path/to/backups/cafeteria-$(date +\%Y\%m\%d).db
```

---

## Security Best Practices

1. **Never commit .env file** to version control
2. **Use HTTPS** in production (free with Let's Encrypt)
3. **Regular backups** - daily recommended
4. **Strong passwords** if you add authentication
5. **Keep dependencies updated**: `npm update`
6. **Monitor logs** for suspicious activity

---

## Getting Help

### Common Issues:
- Check the Troubleshooting section above
- Look at server logs: `npm start` will show errors
- Check browser console (F12) for frontend errors

### Community Support:
- Safaricom Developer Forum: https://developer.safaricom.co.ke/community
- Stack Overflow: Tag questions with `mpesa` and `nodejs`

### Professional Support:
- Hire a developer on Upwork or Fiverr
- Contact local software developers in Nairobi
- Anthropic Claude can help with code questions!

---

## Next Steps

### Phase 1 (MVP - Minimum Viable Product):
✅ M-Pesa integration
✅ Sales recording
✅ Excel export
✅ Basic dashboard

### Phase 2 (Enhancements):
- [ ] Inventory management (track stock levels)
- [ ] Multiple vendor support (different login accounts)
- [ ] SMS notifications for low stock
- [ ] Weekly/monthly reports
- [ ] Photo receipts

### Phase 3 (Advanced):
- [ ] Student accounts (pre-order, tab system)
- [ ] Mobile app (native Android/iOS)
- [ ] Advanced analytics (trends, predictions)
- [ ] Integration with school management system
- [ ] Loyalty program / student rewards

---

## License

This project is open source and free to use for educational purposes.

## Credits

Built with ❤️ for school cafeterias everywhere.

If this helps your cafeteria, consider:
- Sharing with other schools
- Contributing improvements
- Leaving feedback

---

**Happy Selling! 🍽️**
