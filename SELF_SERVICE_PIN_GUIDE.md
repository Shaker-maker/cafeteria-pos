# 🔐 Customer Self-Service PIN Management

Customers can now change their own PIN without contacting support. Here's how it works:

## Feature Overview

**New Settings Tab** (⚙️) gives customers:
- 🔐 Change PIN functionality
- 📊 Account information display
- 🚪 Quick logout button

## How Customers Use It

### **Step-by-Step: Change PIN**

1. **Open Settings**: Click the ⚙️ **Settings** tab (last tab in the app)

2. **Enter Current PIN**: Type their current PIN (e.g., 0000)

3. **Enter New PIN**: Type a new PIN (4-6 digits)
   - Must be different from current PIN
   - Only digits allowed

4. **Confirm New PIN**: Re-enter the new PIN to confirm it matches

5. **Click "Update PIN"**: Button sends securely to server

6. **Success!**: Shows "✅ PIN changed successfully!" message

7. **Fields Clear**: Form auto-clears after 3 seconds

## Security Features

✅ **Password Hashing**
- PIN is hashed (SHA-256) before transmission
- Hash is stored in database, not actual PIN
- Even if database leaks, PINs are safe

✅ **Validation**
- PIN must be 4-6 digits
- New PIN must differ from old PIN
- Confirmation ensures no typos

✅ **Authentication Required**
- Only logged-in users can change PIN
- Token must be valid

✅ **Error Handling**
- Shows clear error messages
- Points out specific validation issues
- 5-second error display before hiding

## Error Messages Users Might See

| Error | Solution |
|-------|----------|
| "Please fill in all fields" | Complete all 3 PIN fields |
| "New PIN must be 4-6 digits" | Use exactly 4-6 digits |
| "New PIN and confirmation do not match" | Retype both new PINs to match |
| "New PIN must be different from current PIN" | Choose a different PIN |
| "PIN must contain only digits" | Use only 0-9, no letters |
| "Incorrect old PIN" | Current PIN was wrong |

## For Support Staff

### **Customer Forgot PIN?**

Two options:

**Option 1: Secure Reset (Recommended)**
```bash
# Reset via API (you need their old PIN to verify):
curl -X POST https://[customer-app].onrender.com/api/auth/change-pin \
  -H "Authorization: Bearer [token]" \
  -H "Content-Type: application/json" \
  -d '{"oldPin":"current","newPin":"new-pin"}'
```

**Option 2: Database Reset (Last Resort)**
- Delete customer's database in Render
- They'll need to set up again (data lost!)
- Only use if customer lost all PIN documentation

**Option 3: Call Customer**
- Ask for verification (name, business, etc.)
- Call them, verify it's really them
- Tell them new temporary PIN via phone
- They change it in Settings after logging in

### **Best Practice Support Workflow**

```
Customer: "I forgot my PIN"
↓
Support: "I can help! Let me verify you own this account"
  - Ask: Business name?
  - Ask: Menu items? (confirm they recognize them)
  - Ask: Recent sales? (confirm they remember)
↓
Support: "Okay, I'm sending you a temporary PIN via SMS: 1111"
↓
Customer: "Got it!"
↓
Support: "Log in with 1111, then go to ⚙️ Settings tab"
↓
Support: "Click the PIN change section, enter 1111 as current PIN"
↓
Support: "Enter your new PIN (something you won't forget!)"
↓
Customer: "Done! Changed to 5555"
↓
Support: "Perfect! Remember that PIN is now 5555"
```

## Technical Details

### **Endpoint Used**
```
POST /api/auth/change-pin
Headers: Authorization: Bearer [token]
Body: {"oldPin":"current","newPin":"new"}
Response: {"message":"PIN changed successfully"}
```

### **Database Changes**
- Hashes new PIN: `sha256(newPin)`
- Updates `business_auth.pin_hash` in database
- Old PIN is never retrieved or logged

### **Frontend Validation**
- Client-side checks before sending (UX)
- Server also validates (security)
- Double-checked for security

## UI Elements

### **Settings Tab Location**
```
Tabs: 💳 Sell | 📊 Dashboard | 📝 Sales | 🧪 Test | ⚙️ Settings
                                                      ↑ New tab
```

### **PIN Change Card**
- Titled: "🔐 Change PIN"
- Blue primary button
- Green success message
- Red error message
- Auto-clears after timeout

### **Account Info Card**
- Shows business name
- Shows login date
- Read-only (informational)

### **Logout Button**
- Red secondary button
- Quick access to logout from settings

## Testing the Feature

### **Local Test**
```bash
1. Start server: node server.js
2. Open: http://localhost:3000
3. Login with PIN: 0000
4. Click ⚙️ Settings tab
5. Current PIN: 0000
6. New PIN: 1234
7. Confirm: 1234
8. Click "Update PIN"
9. See: ✅ Success message
10. Form clears automatically
```

### **Verify New PIN Works**
```bash
1. Logout (button in Settings tab)
2. See PIN login screen again
3. Try old PIN (0000) → Should fail
4. Try new PIN (1234) → Should work!
```

## Customer Communication

### **Email to Customers**

**Subject**: "Your Chafua POS - PIN Security Update"

---

Hi [Customer Name],

You can now **change your own PIN** directly from the app - no need to contact support!

**How to Change Your PIN:**

1. Click the ⚙️ **Settings** tab (it's the last tab in your app)
2. Under "🔐 Change PIN", enter:
   - Your current PIN
   - Your new PIN (4-6 digits)
   - Confirm your new PIN
3. Click "Update PIN"
4. Done! Your PIN is changed immediately

**Security Tips:**
- ✅ Use a PIN you'll remember (something meaningful to you)
- ✅ Don't share your PIN with anyone
- ✅ Change it regularly (monthly is good)
- ✅ If you forget it, call support immediately

**Need Help?**
- Can't remember your current PIN? → Call us for a temporary PIN
- Technical issue? → Check the error message in red (it tells you what's wrong)

Your security is our priority! 🔒

---

Cheers,
Your Chafua POS Team

---

## Rollout Checklist

- [x] Settings tab added to frontend
- [x] PIN change form with validation
- [x] JavaScript handler function
- [x] Success/error messaging
- [x] Auto-clear functionality
- [x] Account info display
- [x] Logout button in settings
- [x] Backend endpoint working (already existed)
- [ ] Customer documentation sent
- [ ] Support team trained
- [ ] Customer feedback collected

## Future Enhancements

Possible additions:
- Multi-factor authentication (PIN + SMS)
- PIN change history log
- "Forgot PIN" recovery via email
- PIN expiry (force change every 90 days)
- PIN strength meter
- Activity log showing who logged in when
