# Chafua POS - Deployment Guide for Multi-Tenant SaaS

This guide explains how to deploy Chafua POS to new customers. Each customer gets a completely isolated instance with their own database, PIN, and data.

## Architecture Overview

- **One server per customer** - Ensures complete data isolation
- **PIN-based authentication** - Simple, no usernames needed
- **Free hosting** - Using Render.com (or Railway, Fly.io)
- **PostgreSQL database** - Scalable to thousands of users

## Quick Start (< 15 minutes per customer)

### Step 1: Fork/Clone Code to GitHub

1. Go to https://github.com and create a new repository named `chafua-[customer-name]`
2. Clone your Chafua code:
   ```bash
   git clone https://github.com/yourusername/Chafua chafua-temp
   cd chafua-temp
   git remote set-url origin https://github.com/yourusername/chafua-[customer-name]
   git push -u origin main
   cd ..
   ```

OR use this deployment URL if you've set it up:
- Go to Render dashboard: https://dashboard.render.com

### Step 2: Deploy on Render.com (FREE)

**Why Render?**
- ✅ 750 free dyno hours/month (covers full month for 1 app)
- ✅ Automatic PostgreSQL setup
- ✅ Deploy directly from GitHub
- ✅ SSL/HTTPS included
- ✅ Easy custom domain

**Steps:**

1. **Sign up**: https://render.com (use GitHub to sign up, easier!)

2. **Connect GitHub**:
   - Go to Render dashboard
   - Click "New +" > "Web Service"
   - Connect your GitHub account
   - Select the `chafua-[customer-name]` repository

3. **Configure the Web Service**:
   ```
   Name: chafua-customer-name
   Environment: Node
   Build Command: npm install
   Start Command: cd backend && node server.js
   Instance Type: Free
   ```

4. **Add Environment Variables**:
   Click "Environment" and add:
   ```
   DB_TYPE=postgres
   DATABASE_URL=[Automatically created by Render PostgreSQL]
   MPESA_CONSUMER_KEY=[Your sandbox/production key]
   MPESA_CONSUMER_SECRET=[Your sandbox/production secret]
   MPESA_SHORTCODE=[Your shortcode]
   MPESA_PASSKEY=[Your passkey]
   NODE_ENV=production
   PORT=3000
   ```

5. **Add PostgreSQL Database**:
   - Go to "PostgreSQL"
   - Click "New"
   - Connect to your service
   - Database will auto-create on first deploy

6. **Deploy**:
   - Click "Create Web Service"
   - Wait 3-5 minutes for deployment
   - Your app is now live at: `https://chafua-customer-name.onrender.com`

### Step 3: Initialize Customer's Database

After deployment completes:

1. **Run schema migration**:
   ```bash
   curl -X POST https://chafua-customer-name.onrender.com/api/health
   ```
   This confirms deployment is live.

2. **First login**:
   - Visit `https://chafua-customer-name.onrender.com`
   - PIN: `0000` (default)
   - ✅ You're in!

### Step 4: Change Default PIN

1. Log in with default PIN: `0000`
2. Go to **Settings** (⚙️ icon) or access via:
   ```bash
   curl -X POST https://chafua-customer-name.onrender.com/api/auth/change-pin \
     -H "Authorization: Bearer [token]" \
     -H "Content-Type: application/json" \
     -d '{"oldPin":"0000","newPin":"1234"}'
   ```
3. Share new PIN with customer via **secure channel** (phone call, encrypted message, NOT email)

### Step 5: Share with Customer

Send customer:
- **URL**: `https://chafua-customer-name.onrender.com`
- **PIN**: `[new PIN you set]`
- **Instructions**: 
  ```
  1. Open URL in web browser
  2. Enter your PIN
  3. Click Login
  4. Start selling!
  ```

---

## Deployment Checklist

Before giving to customer, verify:

- [ ] Server deployed and running
- [ ] Can login with PIN
- [ ] Can view menu items
- [ ] Can complete a test sale
- [ ] Export to Excel works
- [ ] M-Pesa test payments work (if using test mode)
- [ ] Database persists data on refresh
- [ ] HTTPS is enabled (green lock in browser)

---

## Common Tasks

### Change Customer's PIN

```bash
curl -X POST https://[customer-app].onrender.com/api/auth/change-pin \
  -H "Authorization: Bearer [admin-token]" \
  -H "Content-Type: application/json" \
  -d '{"oldPin":"0000","newPin":"5678"}'
```

### Export Customer's Data (Backup)

```bash
curl -X GET https://[customer-app].onrender.com/api/export/sales \
  -H "Authorization: Bearer [token]" \
  > customer_backup_$(date +%Y%m%d).csv
```

### Reset Customer's Database

⚠️ **CAUTION**: This deletes all data!

1. Go to Render dashboard
2. Find customer's PostgreSQL database
3. Delete the database
4. Go to web service > Environment
5. Update DATABASE_URL to empty string
6. Re-deploy (new database auto-creates)

---

## Multi-Customer Management

### Organizing Deployments

Create a spreadsheet to track all customers:

| Customer | App URL | Database | PIN | Created | Status |
|----------|---------|----------|-----|---------|--------|
| School A | chafua-schoola.onrender.com | PostgreSQL | XXXX | 2026-01-31 | Active |
| School B | chafua-schoolb.onrender.com | PostgreSQL | XXXX | 2026-02-01 | Active |
| Café C   | chafua-cafec.onrender.com   | PostgreSQL | XXXX | 2026-02-02 | Active |

### Directory Structure (GitHub)

Keep all customer repos organized:
```
/chafua-customer-a/
/chafua-customer-b/
/chafua-customer-c/
```

Each is an independent repository and deployment.

---

## Troubleshooting

### "Deploy failed"
- Check build logs in Render dashboard
- Verify package.json exists in `/backend`
- Try redeploy: Click "Manual Deploy" > "Deploy latest commit"

### "Cannot connect to database"
- Check DATABASE_URL is set in Environment
- Go to PostgreSQL settings, copy connection string
- Paste into DATABASE_URL environment variable
- Redeploy

### "PIN login not working"
- Default PIN is always `0000`
- Verify endpoint: `curl http://app/api/health` should return 200
- Check server logs in Render dashboard

### "Customer lost access"
- They can't remember PIN → Call support number you have on file
- Email PIN to them via **secure channel**
- Or reset database (nuclear option, loses all data)

### "M-Pesa payments not showing"
- Verify MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET are set
- Check if using sandbox vs production keys
- Use Test M-Pesa tab to verify system works

---

## Advanced Customization Per Customer

### Custom Business Name

Edit before deployment:

```javascript
// frontend/index.html line ~1720
const API_BASE = window.location.origin;
let businessName = localStorage.getItem('businessName') || 'Chafua POS';
```

Or create environment variable:
```env
BUSINESS_NAME=Customer's Business Name
```

Then use in frontend via:
```javascript
const businessName = process.env.BUSINESS_NAME || 'Chafua POS';
```

### Custom Menu Items

Each deployment has its own database, so:
1. Log in as admin
2. Add menu items via UI
3. They persist per customer

### White-Label (Your Company Logo)

Edit HTML before deployment:

```html
<!-- Line 1468 -->
<h1>🍽️ Chafua</h1>
<!-- Change to: -->
<h1>🏪 Your Company Name</h1>
```

---

## Cost Breakdown

| Item | Free Option | Notes |
|------|------------|-------|
| Web Server | Render (750 hrs/mo) | ✅ Free tier covers 1 full server |
| Database | PostgreSQL | ✅ Free on Render ($0) |
| Domain | Render subdomain | render.com URL or $12/year custom |
| SSL/HTTPS | Included | ✅ Free automatic |
| **Total per customer** | **$0-12/mo** | Render free tier + optional domain |

**Scale pricing**: If customer needs more performance:
- Render paid: $7-25/month per server
- Custom domain: +$12/year
- Still much cheaper than custom development!

---

## Revenue Ideas

### Pricing Model 1: SaaS Subscription
- **Basic**: KES 2,000/month (1 till, SQLite)
- **Pro**: KES 5,000/month (PostgreSQL, 10 tills, 1 admin)
- **Enterprise**: KES 15,000/month (unlimited, custom domain, support)

### Pricing Model 2: One-Time License
- **Perpetual**: KES 10,000 (one-time payment, your support)
- **+ Support**: KES 500/month

### Pricing Model 3: Commission Based
- 2-3% of all M-Pesa transactions processed
- Customer has no upfront cost

---

## Next Steps

1. **Prepare your GitHub**: Create private repository for customer code
2. **Set up Render account**: Get free tier active
3. **Test deployment**: Deploy to test customer first
4. **Document for team**: Share this guide with your team
5. **Launch to market**: Start onboarding real customers!

---

## Support

For customer support:

| Issue | Solution |
|-------|----------|
| Forgot PIN | Call support → text PIN securely |
| Technical issue | Check Render logs → troubleshoot |
| Feature request | Create GitHub issue on codebase |
| Performance issue | Upgrade from free to paid Render tier |

---

## Version Updates

To update all customer instances:

1. Push changes to your main GitHub repo
2. Each customer's deployment auto-syncs (or trigger manual redeploy)
3. All customers get latest features automatically

Example: Add new payment method
- Update `server.js` in main repo
- Push to GitHub
- All customer instances update on next deploy
- No per-customer changes needed

---

**You're ready to start selling Chafua POS to multiple businesses!** 🚀

Each customer gets enterprise-grade isolation, security, and scalability for free tier pricing. Perfect for schools, cafes, and small businesses across Kenya.
