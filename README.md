# 🍽️ Chafua POS System

> A modern Point of Sale system for school cafeterias with automatic M-Pesa integration

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

## 🎯 The Problem We Solve

Your school cafeteria currently does this:
1. ✅ Student pays via M-Pesa
2. 📱 Vendor checks phone message
3. 📝 Vendor writes in book
4. 🗑️ Vendor deletes message
5. 📸 Vendor takes photo of book
6. 💻 Owner re-enters data into Excel

**This is inefficient, error-prone, and wastes time!**

## ✨ Our Solution

With Chafua POS:
1. ✅ Student pays via M-Pesa
2. 🎯 **Payment appears automatically**
3. 👆 **Vendor clicks items → Done!**
4. 📊 **Owner sees real-time dashboard**
5. 📥 **Export to Excel with one click**

**That's it! No books, no photos, no re-typing.**

---

## 🚀 Quick Start

### Option 1: Try It Now (No Installation)

1. Download `frontend/index.html`
2. Double-click to open in browser
3. Start using immediately!

Perfect for testing or small operations.

### Option 2: Full Setup (5 minutes)

```bash
# 1. Clone or download this project
cd cafeteria-pos/backend

# 2. Install dependencies
npm install

# 3. Start the server
npm start

# 4. Open browser
# Go to http://localhost:3000
```

That's it! You now have a working POS system.

---

## 📱 Features

### For Vendors
- ✅ Automatic M-Pesa payment detection
- ✅ Quick tap-to-add menu interface
- ✅ Shopping cart with quantity controls
- ✅ Works offline (syncs when connection returns)
- ✅ Match payments to sales automatically

### For Owners
- ✅ Real-time sales dashboard
- ✅ Today's revenue, transactions, and trends
- ✅ Complete sales history
- ✅ One-click Excel export
- ✅ See most popular items
- ✅ Access from anywhere

### Technical Features
- ✅ Progressive Web App (install on phone)
- ✅ Works offline
- ✅ Mobile responsive
- ✅ No App Store needed
- ✅ Free and open source

---

## 📸 Screenshots

### Vendor View
```
┌─────────────────────────────────────┐
│  📱 Recent M-Pesa Payments          │
│  ┌───────────────────────────────┐  │
│  │ QFX1234567    KES 100         │  │
│  │ 10:30 AM      ✓ Available     │  │
│  └───────────────────────────────┘  │
│                                      │
│  🍔 Menu Items                      │
│  ┌────────┐ ┌────────┐ ┌────────┐ │
│  │Chapati │ │ Beans  │ │  Rice  │ │
│  │KES 20  │ │ KES 30 │ │ KES 40 │ │
│  └────────┘ └────────┘ └────────┘ │
│                                      │
│  🛒 Current Order                   │
│  Chapati x2    KES 40               │
│  Tea x1        KES 15               │
│  ─────────────────────              │
│  Total:        KES 55               │
│  [Clear] [Complete Sale]            │
└─────────────────────────────────────┘
```

### Owner Dashboard
```
┌─────────────────────────────────────┐
│  📊 Today's Performance              │
│  ┌──────────┐ ┌──────────┐         │
│  │ KES 3250 │ │    45    │         │
│  │  Sales   │ │  Orders  │         │
│  └──────────┘ └──────────┘         │
│                                      │
│  📈 Sales History                   │
│  Time     | Items      | Amount     │
│  ─────────────────────────────────  │
│  10:30 AM | Chapati... | KES 55    │
│  10:25 AM | Rice...    | KES 80    │
│  [📥 Export Excel] [🔄 Refresh]     │
└─────────────────────────────────────┘
```

---

## 🛠️ Installation Guide

### Prerequisites
- Node.js 14+ (download from [nodejs.org](https://nodejs.org))
- M-Pesa Till or Paybill number
- Safaricom Developer account (free at [developer.safaricom.co.ke](https://developer.safaricom.co.ke))

### Step-by-Step Setup

#### 1. Download the Project
```bash
# Clone with git
git clone https://github.com/yourusername/cafeteria-pos.git
cd cafeteria-pos

# Or download ZIP and extract
```

#### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your M-Pesa credentials
nano .env  # or use any text editor
```

#### 3. Configure M-Pesa (see [M-Pesa Setup Guide](docs/SETUP_GUIDE.md#mpesa-integration-setup))

Add these to your `.env` file:
```env
MPESA_CONSUMER_KEY=your_key_here
MPESA_CONSUMER_SECRET=your_secret_here
MPESA_SHORTCODE=your_till_number
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback
```

#### 4. Start the Server
```bash
# Development mode (auto-restart on changes)
npm run dev

# Production mode
npm start
```

#### 5. Access the Application
- **Local:** http://localhost:3000
- **Mobile (same WiFi):** http://YOUR_COMPUTER_IP:3000
- Find your IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)

---

## 📖 Documentation

- **[Setup Guide](docs/SETUP_GUIDE.md)** - Detailed installation and configuration
- **[Technical Architecture](docs/TECHNICAL_ARCHITECTURE.md)** - How it works under the hood
- **[API Documentation](docs/API.md)** - REST API reference
- **[Troubleshooting](docs/SETUP_GUIDE.md#troubleshooting)** - Common issues and solutions

---

## 🔧 Configuration

### Menu Items

Edit menu in the database or via API:

```javascript
// Add item via API
POST /api/menu
{
  "name": "Mandazi",
  "price": 10
}

// Or edit cafeteria.db directly
INSERT INTO menu_items (name, price) VALUES ('Mandazi', 10);
```

### Customization

Edit `frontend/index.html` to:
- Change colors (search for `#667eea`)
- Modify menu layout
- Add your school logo
- Change currency (KES → USD, etc.)

---

## 🌐 Deployment

### Free Hosting Options

#### Render.com (Recommended)
```bash
# 1. Push code to GitHub
# 2. Connect to Render.com
# 3. Create Web Service
# 4. Deploy!
```
**Cost:** Free tier available

#### Heroku
```bash
heroku create chafua-pos
git push heroku main
heroku config:set MPESA_CONSUMER_KEY=xxx
```
**Cost:** $5-7/month

#### Local Server (School Computer)
- Install Node.js on dedicated computer
- Run `npm start`
- Access from school WiFi
- **Cost:** Free

See [Deployment Guide](docs/SETUP_GUIDE.md#deployment-options) for details.

---

## 📊 Usage

### Daily Operations

**For Vendors:**
1. Open app on phone/tablet
2. When payment arrives, tap it
3. Tap menu items ordered
4. Hit "Complete Sale"
5. Done!

**For Owners:**
1. Click "Owner Dashboard"
2. View today's stats
3. Check sales history
4. Export to Excel when needed

### Tips for Success
- ✅ Export data daily as backup
- ✅ Keep one device always online for sync
- ✅ Train vendors on basic operation
- ✅ Monitor M-Pesa credits regularly
- ✅ Update menu prices as needed

---

## 🔒 Security

- ✅ Environment variables for secrets
- ✅ HTTPS in production
- ✅ SQL injection prevention
- ✅ Regular automated backups
- ✅ Rate limiting on API

**Important:**
- Never commit `.env` file to git
- Use strong passwords if adding authentication
- Backup database daily
- Keep dependencies updated: `npm update`

---

## 🐛 Troubleshooting

### M-Pesa Payments Not Showing
1. Check internet connection
2. Verify M-Pesa credentials in `.env`
3. Ensure callback URL is accessible
4. Check server logs for errors

### Can't Access from Phone
1. Ensure devices on same WiFi
2. Use computer's IP, not "localhost"
3. Disable firewall temporarily
4. Check port 3000 is allowed

### Data Not Saving
1. Check browser console (F12)
2. Verify database file exists
3. Ensure write permissions
4. Try exporting and re-importing

See [Full Troubleshooting Guide](docs/SETUP_GUIDE.md#troubleshooting)

---

## 🗺️ Roadmap

### ✅ Version 1.0 (Current)
- M-Pesa integration
- Sales recording
- Excel export
- Basic dashboard

### 🔄 Version 1.1 (Next)
- [ ] Inventory management
- [ ] Multiple vendor accounts
- [ ] SMS notifications
- [ ] Advanced reports

### 🚀 Version 2.0 (Future)
- [ ] Student pre-ordering
- [ ] Native mobile app
- [ ] Loyalty program
- [ ] School system integration

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork the repository**
2. **Create feature branch:** `git checkout -b feature/amazing-feature`
3. **Commit changes:** `git commit -m 'Add amazing feature'`
4. **Push to branch:** `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Code Style
- Use ESLint and Prettier
- Write clear commit messages
- Add tests for new features
- Update documentation

---

## 📜 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

**TL;DR:** You can use this for free, modify it, and even sell it. Just keep the license notice.

---

## 💬 Support

### Getting Help
- 📖 Read the [Setup Guide](docs/SETUP_GUIDE.md)
- 🔍 Check [Troubleshooting](docs/SETUP_GUIDE.md#troubleshooting)
- 💡 Open an [Issue](https://github.com/yourusername/cafeteria-pos/issues)
- 🌟 Star this repo if it helps you!

### Community
- Share with other schools
- Report bugs and suggest features
- Contribute code improvements
- Spread the word!

---

## 👏 Acknowledgments

- Built for school cafeterias everywhere
- Inspired by the inefficiency of manual record-keeping
- Powered by Safaricom's Daraja API
- Made with ❤️ for education

---

## 📞 Contact

**Questions?** Open an issue or reach out!

**Using this in your school?** Let us know! We'd love to hear your story.

---

## ⭐ Star History

If this project helps your cafeteria, please give it a star! It helps others discover it too.

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/cafeteria-pos&type=Date)](https://star-history.com/#yourusername/cafeteria-pos&Date)

---

**Made with ❤️ for Kenyan schools**

---

## 📋 Quick Links

- [🚀 Quick Start](#-quick-start)
- [📱 Features](#-features)
- [🛠️ Installation](#️-installation-guide)
- [📖 Documentation](#-documentation)
- [🌐 Deployment](#-deployment)
- [🐛 Troubleshooting](#-troubleshooting)
- [🤝 Contributing](#-contributing)

---

**Version 1.0.0** | Last Updated: January 2025
