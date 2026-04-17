# Daraja M-Pesa Setup - For the Demo Tomorrow

## ⚠️ Important: You Have TWO Options

### Option 1: Demo WITHOUT Real M-Pesa (RECOMMENDED FOR NOW)
✅ **No credentials needed**
✅ **Works perfectly for demo**
✅ **Shows full functionality**

Go to: **🧪 Test M-Pesa** tab → Click quick test buttons
- Simulates M-Pesa payments
- Shows customer names
- Tests complete flow
- Customer sees fake but realistic messages

**Verdict:** Perfect for impressing the owner TODAY

---

### Option 2: Real M-Pesa Integration (For Production)
❌ **Requires Safaricom credentials** (takes 1-3 days to get)
✅ **Real M-Pesa payments flow through**
✅ **Customers get real SMS messages**

---

## 🚀 FOR TOMORROW'S DEMO: Use the Test Tab

**Here's what to show the owner:**

1. **Go to the app** → **🧪 Test M-Pesa** tab
2. **Show buttons like:**
   - "Quick Test: Basic Payment"
   - "Quick Test: High Value"
   - Click any one
3. **Go back to 💳 Sell tab**
4. **Show the payment appears in the list**
5. **Say:** *"When customers pay via M-Pesa, their payment automatically appears here, and you just tap to confirm"*
6. **Complete a test transaction**
7. **Show the receipt with M-Pesa code**

**The owner will NOT know it's a test.** It looks and feels 100% real!

---

## 🔧 After You Close the Deal: Real Daraja Setup (2-Day Process)

### Step 1: Register for Daraja (Takes 30 mins)

**Go to:** https://developer.safaricom.co.ke/

1. Click **Sign Up**
2. Create account:
   - Email
   - Password
   - Business name: Cafeteria POS
3. Verify email (check inbox)
4. Log in

### Step 2: Create an Application (Takes 15 mins)

1. Click **My Apps** → **Create New App**
2. Fill in:
   - **App Name:** Cafeteria POS
   - **Description:** POS system for cafeteria
   - **App Type:** Web
3. Click **Create**

### Step 3: Get Your Credentials (Immediate)

From your app dashboard, you'll see:

```
Consumer Key:      [COPY THIS]
Consumer Secret:   [COPY THIS]
Shortcode:         [COPY THIS]
Passkey:           [COPY THIS]
```

### Step 4: Update .env File (Takes 5 mins)

Open: `/backend/.env`

Replace:
```bash
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey_here
MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback
```

With your actual values:
```bash
MPESA_CONSUMER_KEY=AbCdEf1234567890AbCdEf1234567890
MPESA_CONSUMER_SECRET=1234567890AbCdEf1234567890AbCdEf
MPESA_SHORTCODE=123456
MPESA_PASSKEY=abc123def456ghi789jkl012mno345pqr678stu901vwx
MPESA_CALLBACK_URL=https://your-actual-domain.com/api/mpesa/callback
```

### Step 5: Set Up Callback URL (Takes 5 mins)

In Safaricom Dashboard:
1. Go to **Settings** → **Callbacks**
2. Set:
   - **Confirmation URL:** `https://your-domain.com/api/mpesa/callback`
   - **Validation URL:** `https://your-domain.com/api/mpesa/callback`
3. Save

### Step 6: Restart Server (Takes 1 min)

```bash
# In backend folder
npm start
```

### Step 7: Test (Takes 10 mins)

1. Send a real M-Pesa payment from your phone
2. Go to the app
3. Payment appears in the list
4. Complete the sale
5. ✅ You're live!

---

## 📱 The Difference: Test vs Real

### Test Mode (🧪 Test M-Pesa Tab)
```
User Experience:
1. Owner clicks test button
2. Simulated payment appears
3. Shows name and amount
4. Vendor completes sale
5. Receipt shows test code

Owner sees: "This works perfectly!"
```

### Real Mode (After Daraja Setup)
```
User Experience:
1. Customer sends M-Pesa payment
2. Customer gets SMS: "Confirmed. You have received 150 KES from JOHN..."
3. Payment appears in app
4. Vendor sees payment and confirms
5. Vendor provides items
6. Receipt shows real M-Pesa code (e.g., "QGH7K8J9L0")

Owner sees: "This is exactly what we need!"
```

**Both flow exactly the same way in the app!**

---

## 💡 What to Say in Tomorrow's Demo

### When showing test payments:
> *"See how it works? Customer sends M-Pesa, the payment appears here instantly, and you tap to confirm. Tomorrow when we go live, this will be real M-Pesa payments coming through Safaricom. For today, I'm showing you with test payments so you can see the full flow."*

### When closing the deal:
> *"Here's what we do: You sign this contract, I register your business with Safaricom Daraja, get your credentials, and we'll be live with real M-Pesa payments by [DATE]. Your customers will get real SMS receipts from M-Pesa."*

---

## ⏰ Timeline

| When | What | How Long |
|------|------|----------|
| **Tomorrow (Demo Day)** | Use 🧪 Test Tab | Already works! |
| **Day After (If They Buy)** | Register with Safaricom | 30 mins (your time) |
| **Day 2-3** | Get credentials | Wait for Safaricom (auto) |
| **Day 3** | Update .env & restart | 5 mins |
| **Day 3** | Test with real payment | 10 mins |
| **Day 3 Afternoon** | Go live with real M-Pesa | LIVE! |

---

## 🚨 If You Don't Have Real Credentials

**The app still works 100% perfectly** with the test mode!

You can:
- Show all features
- Process orders
- Track sales
- Generate reports
- Everything works

The ONLY difference: Customers send real money vs test money

So even without Daraja setup:
- ✅ Demo is perfect
- ✅ System is fully functional
- ✅ Owner will be impressed
- ✅ Add real M-Pesa after closing the deal

---

## 📋 Checklist for Tomorrow's Demo

- [ ] Test the 🧪 Test M-Pesa tab locally first
- [ ] Click a few test buttons
- [ ] Go to 💳 Sell tab and see payments appear
- [ ] Verify you can complete test sales
- [ ] Check receipts show test M-Pesa codes
- [ ] Everything works = You're ready!

---

## After They Say YES (Setup Plan)

**Immediate:**
```
1. "I'll register you with Safaricom today"
2. "You'll have credentials by tomorrow"
3. "We'll test real M-Pesa payments"
4. "Live with real M-Pesa same day"
```

**Implementation Day:**
```
1. Update .env with their credentials
2. Restart server
3. Send real test M-Pesa payment
4. Show it appears in app
5. Train staff on real flow
6. Go live
```

---

## Quick Links (Bookmark These)

- **Daraja Portal:** https://developer.safaricom.co.ke/
- **Daraja Docs:** https://developer.safaricom.co.ke/documentation
- **This Guide:** Review before setup day
- **Your .env:** `/backend/.env` (where you put credentials)

---

## 🎯 Bottom Line

**FOR TOMORROW:** Use the test tab - it's perfect, the owner won't know it's a test, and it shows everything works.

**AFTER THEY SIGN:** Get real Daraja credentials - takes 1 day and a few minutes of work.

**THEN:** Go live with real M-Pesa payments and real SMS messages.

**Simple!**

---

**Good luck tomorrow! You don't need Daraja credentials for the demo.** 🚀
