# Daraja M-Pesa Integration Setup Guide

## Quick Start (Testing Without Real Payments)

If you don't have Daraja credentials yet, you can **test the entire system** using the built-in test tab:

1. Go to **🧪 Test M-Pesa** tab
2. Click "Quick Test Payments" or create a custom payment
3. Go to **💳 Sell** tab
4. Enter the payer's name (e.g., "John Kamau")
5. Payment auto-matches and you can complete the sale

This lets you test without any Safaricom integration!

---

## Setting Up Daraja (Real M-Pesa Integration)

### Step 1: Register with Safaricom

1. Visit **https://developer.safaricom.co.ke/**
2. Click "Sign Up" and create an account
3. Verify your email
4. Log in to the portal

### Step 2: Create a New Application

1. Go to **My Apps** → **Create New App**
2. Fill in app details:
   - **App Name**: Cafeteria POS
   - **Description**: School cafeteria payment system
   - **App Type**: Web
3. Click **Create**
4. You'll see your credentials

### Step 3: Get Your Credentials

From the app dashboard, copy these values:

```
Consumer Key:     ****
Consumer Secret:  ****
Business Shortcode (for STK Push): ****
Passkey:          ****
```

### Step 4: Configure Environment Variables

Create/edit `backend/.env`:

```bash
# M-Pesa Daraja Configuration
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here
MPESA_SHORTCODE=your_shortcode_here
MPESA_PASSKEY=your_passkey_here
MPESA_ENVIRONMENT=sandbox
MPESA_CALLBACK_URL=https://your-domain.com/api/mpesa/callback

# Database
DB_PATH=./database.sqlite

# Server
PORT=3000
NODE_ENV=development
```

### Step 5: Set Up Callback URL

In **Safaricom Daraja Dashboard**:

1. Go to **Settings** → **Callbacks**
2. Set **Confirmation URL**: `https://your-domain.com/api/mpesa/callback`
3. Set **Validation URL**: `https://your-domain.com/api/mpesa/callback`
4. Choose **GET** or **POST** (POST is recommended)
5. Save

### Step 6: Test with Safaricom Test Credentials

Safaricom provides test phone numbers and paybill codes in sandbox mode:

- **Test Phone**: Use any number starting with 254
- **Test Amount**: 1-100,000 KES
- **Paybill Code**: Your business shortcode from dashboard

### Step 7: Restart Your Server

```bash
# In backend folder
npm install  # Install any missing packages

# Start server
npm start
# or
node server.js
```

---

## How M-Pesa Payments Flow

### 1. **Customer Pays via M-Pesa**
Student receives on their phone:
```
Confirmed. you have received 100.00 KES from JOHN KAMAU on 12:30, 31 Jan 2026
```

### 2. **System Receives Callback**
- M-Pesa API sends payment data to your callback URL
- System extracts: payer name ("JOHN KAMAU"), amount (100), receipt code

### 3. **System Stores Payment**
Payment stored in database with:
- Payer name
- Amount
- M-Pesa receipt code
- Timestamp
- Phone number
- Status: "unused"

### 4. **Vendor Completes Sale**
1. Vendor enters student name: "JOHN KAMAU"
2. System searches and finds matching payment
3. Vendor taps to confirm
4. Sale is saved to database
5. Payment marked as "used" → Removed from list

---

## Testing the System (Two Approaches)

### Approach 1: Using Test Tab (No Credentials Needed)

```
1. Go to 🧪 Test M-Pesa tab
2. Click a quick test button or create custom payment
3. Go to 💳 Sell tab
4. Enter the payer name
5. Payment appears and auto-selects
6. Complete the sale
```

**Best for**: Development, testing all features without real M-Pesa

### Approach 2: Using Daraja Sandbox (With Credentials)

```
1. Configure .env with Daraja credentials
2. Restart server
3. Actual M-Pesa payments flow through
4. System extracts names and stores payments
```

**Best for**: Production, testing real M-Pesa integration

---

## Troubleshooting

### "No payments found"
- Check that M-Pesa payments have actually been received
- Verify callback URL is reachable from Safaricom servers
- Check server logs: `console.log()` output in terminal

### "Payer name not extracted"
- M-Pesa message format might be different
- Check the `result_desc` in database: `SELECT result_desc FROM mpesa_transactions`
- Update regex pattern in `backend/server.js` if format differs

### Payment appears but doesn't auto-select
- Make sure name matches exactly (case-sensitive for exact match)
- Check: Does name in payment = name vendor entered?

### "Cannot connect to server"
- Is Node.js server running? Check: `npm start` output
- Is port 3000 open? Check if something else uses it
- Try: `lsof -i :3000` to see what's using port 3000

---

## Going to Production

### 1. Switch from Sandbox to Production

In `backend/.env`:
```bash
MPESA_ENVIRONMENT=production  # Changed from "sandbox"
```

### 2. Get Production Credentials

1. Contact Safaricom for production API credentials
2. Set up production callback URL
3. Test with real M-Pesa payments
4. Update .env with production credentials

### 3. Deploy Your Server

Use platforms like:
- **Railway** (recommended for Node.js)
- **Render**
- **Heroku**
- **AWS**
- **DigitalOcean**

Set environment variables on your hosting platform.

---

## Database Schema

### M-Pesa Transactions Table
```sql
CREATE TABLE mpesa_transactions (
  id                    INTEGER PRIMARY KEY,
  payer_name           TEXT,        -- Extracted from message
  amount               REAL,        -- Payment amount
  mpesa_receipt_number TEXT,        -- Receipt code (e.g., "QGH7K8J9L0")
  phone_number         TEXT,        -- Payer phone
  result_code          INTEGER,     -- 0 = success
  used                 BOOLEAN,     -- 0 = available, 1 = used in sale
  used_in_sale_id      INTEGER,     -- Link to sales table
  created_at           DATETIME     -- Payment timestamp
);
```

### Sales Table (With M-Pesa Link)
```sql
CREATE TABLE sales (
  id                   INTEGER PRIMARY KEY,
  student_name         TEXT,        -- Student's name
  mpesa_transaction_id INTEGER,     -- Link to M-Pesa transaction
  mpesa_code          TEXT,         -- M-Pesa receipt number
  amount              REAL,
  payment_method      TEXT,         -- "mpesa" or "cash"
  vendor_id           TEXT,
  created_at          DATETIME
);
```

---

## API Endpoints

### For Testing (No Credentials Needed)
```
POST /api/test/simulate-mpesa
  Body: { amount, payerName, phoneNumber }
  Returns: Created test payment

GET /api/test/suggestions
  Returns: List of test payment suggestions
```

### For M-Pesa Payments (With Credentials)
```
POST /api/mpesa/callback
  Receives: M-Pesa payment callbacks

GET /api/mpesa/recent
  Returns: Recent unused payments (last 30 min)

GET /api/mpesa/search/:payerName
  Returns: Payments matching payer name
```

### For Sales
```
POST /api/sales
  Body: { items, student_name, mpesa_transaction_id, ... }
  Marks M-Pesa transaction as used

GET /api/sales
  Returns: All sales history
```

---

## Quick Reference

| Task | Steps |
|------|-------|
| Test without Daraja | Go to 🧪 Test M-Pesa tab, click a button |
| Set up Daraja | Visit developer.safaricom.co.ke, create app, copy credentials |
| Add credentials | Edit backend/.env with your credentials |
| Test Daraja | Send test M-Pesa payment, verify it appears in system |
| Go to production | Change MPESA_ENVIRONMENT to "production" in .env |

---

## Support

For issues with:
- **Daraja API**: Visit https://developer.safaricom.co.ke/documentation
- **This System**: Check server logs and database directly

```sql
-- See all recent payments
SELECT * FROM mpesa_transactions ORDER BY created_at DESC LIMIT 20;

-- See which payments are used
SELECT * FROM mpesa_transactions WHERE used = 1;

-- Link payments to sales
SELECT s.id, s.student_name, m.payer_name, m.amount 
FROM sales s 
LEFT JOIN mpesa_transactions m ON s.mpesa_transaction_id = m.id;
```
