# Fast Foods Cafeteria - Menu Customization Guide

## Quick Setup (5-10 minutes)

Your app is **already customizable**. Here's exactly how to set it up for a fast foods cafeteria:

---

## 🚀 Step-by-Step Setup for Demo/Meeting

### **Step 1: Open the App**
```
1. Start the backend: cd backend && npm start
2. Open browser: http://localhost:3000
3. Enter PIN: 0000
```

### **Step 2: Go to Settings**
- Click the **⚙️ Settings** tab (bottom right)
- Scroll down to find **"📋 Manage Menu"** section

### **Step 3: Add Fast Foods Items**

**Copy-paste these exact items:**

#### **🍔 BURGERS** (Most popular)
1. Item Name: `Beef Burger` | Category: `Burgers` | Price: `150`
2. Item Name: `Chicken Burger` | Category: `Burgers` | Price: `120`
3. Item Name: `Deluxe Burger` | Category: `Burgers` | Price: `200`

#### **🍟 SIDES**
1. Item Name: `French Fries` | Category: `Sides` | Price: `80`
2. Item Name: `Onion Rings` | Category: `Sides` | Price: `100`
3. Item Name: `Coleslaw` | Category: `Sides` | Price: `60`

#### **🥤 DRINKS**
1. Item Name: `Soda (Medium)` | Category: `Drinks` | Price: `50`
2. Item Name: `Soda (Large)` | Category: `Drinks` | Price: `70`
3. Item Name: `Juice` | Category: `Drinks` | Price: `60`
4. Item Name: `Water` | Category: `Drinks` | Price: `30`

#### **🍗 CHICKEN**
1. Item Name: `Fried Chicken (1 Piece)` | Category: `Chicken` | Price: `90`
2. Item Name: `Fried Chicken (2 Piece)` | Category: `Chicken` | Price: `150`
3. Item Name: `Fried Chicken (3 Piece)` | Category: `Chicken` | Price: `200`

#### **🌭 HOT DOGS**
1. Item Name: `Hot Dog` | Category: `Hot Dogs` | Price: `80`
2. Item Name: `Loaded Hot Dog` | Category: `Hot Dogs` | Price: `120`

#### **🍕 PIZZA** (if available)
1. Item Name: `Pizza Slice` | Category: `Pizza` | Price: `100`
2. Item Name: `Full Pizza` | Category: `Pizza` | Price: `600`

---

## 📊 What This Looks Like in the App

After adding items, when customers go to the **Sell** tab, they'll see:

```
🍔 BURGERS
  Beef Burger ................. KES 150
  Chicken Burger .............. KES 120
  Deluxe Burger ............... KES 200

🍟 SIDES
  French Fries ................ KES 80
  Onion Rings ................. KES 100
  Coleslaw .................... KES 60

🥤 DRINKS
  Soda (Medium) ............... KES 50
  Soda (Large) ................ KES 70
  Juice ....................... KES 60
  Water ....................... KES 30

🍗 CHICKEN
  Fried Chicken (1 Piece) ..... KES 90
  Fried Chicken (2 Piece) ..... KES 150
  Fried Chicken (3 Piece) ..... KES 200

🌭 HOT DOGS
  Hot Dog ..................... KES 80
  Loaded Hot Dog .............. KES 120
```

---

## ⚡ During the Demo

### **What to Show the Owner:**
1. **Login** - Show PIN security
2. **Settings Tab** - Show menu customization
3. **Add 2-3 items** - Live add items right in front of them
4. **Sell Tab** - Show items now appear in menu
5. **Make a test sale** - Ring up a burger + fries + drink

### **Script:**
> "See? I can add any item to the menu. Just now, I added a Beef Burger for 150 Shillings. Now watch the Sell tab—there it is, organized by category. Your staff can tap items and ring them up. Let me add a customer phone and process a payment..."

---

## 🔧 How to Delete Items

If you add something wrong:
1. Go to **Settings** tab
2. Scroll to **"Manage Menu"** section
3. Find the item and click **🗑️ Delete** button
4. Item removed instantly

---

## 📱 Mobile/Staff View

When a **staff member** logs in on a mobile phone, they'll see:
- Large, easy-to-tap buttons for each menu item
- Organized by category (Burgers, Sides, etc.)
- Clear pricing
- Just tap the items, enter customer phone, process payment

---

## 💰 Pricing Tips for This Cafeteria

Based on typical Nairobi fast foods pricing:

| Item | Suggested Price |
|------|-----------------|
| Beef Burger | KES 150-200 |
| Chicken Burger | KES 100-150 |
| French Fries | KES 50-100 |
| Soda | KES 40-80 |
| Juice | KES 50-100 |
| Fried Chicken (1pc) | KES 80-120 |
| Hot Dog | KES 70-120 |
| Pizza Slice | KES 80-150 |

*Adjust based on their actual menu and location*

---

## ✨ What Makes This Better Than Manual

| Manual System | Your App |
|---------------|----------|
| ❌ Paper or whiteboard menu | ✅ Digital, easy to update |
| ❌ Calculate totals with pen | ✅ Auto-calculates with M-Pesa |
| ❌ Can't track sales | ✅ See daily/weekly reports |
| ❌ Errors on bills | ✅ Accurate every time |
| ❌ Cash management nightmare | ✅ Payment tracking |
| ❌ No offline capability | ✅ Works without internet |

---

## 🎯 What to Bring to Meeting

- [ ] Laptop/tablet to show demo
- [ ] Printed menu items list
- [ ] Mobile phone to show staff view
- [ ] Sample receipt/report printout
- [ ] Pricing sheet (use table above)

---

## 🚨 Important Notes

1. **They don't need to add ALL items now**
   - Start with top 10-15 items
   - Add more later as needed
   - System is flexible

2. **They can change prices anytime**
   - Delete and re-add with new price
   - Or I can add edit feature later

3. **Offline mode works**
   - Even if Wi-Fi is down, they can still take orders
   - Sync happens when internet comes back

4. **Multi-terminal ready**
   - They can add the same PIN on multiple tablets/phones
   - All will sync to same database

---

## 📞 Support for Them (After Sale)

Tell the owner:
- "I'll help you add their current menu items the first day"
- "Any changes to menu, we can do in minutes"
- "I'll train your staff on how to use it (30 mins)"
- "Call me if there's any issue"

---

## Example: Your Exact Words During Demo

*"Let me show you exactly how this works for your menu. I'll add three items right now:"*

1. Click **Settings**
2. Enter: `Beef Burger | Burgers | 150`
3. Click **Add Item**
4. Green toast appears: ✅ "Beef Burger added to menu!"
5. Item appears in list below
6. Click **Sell** tab
7. Show the burger appears in menu
8. Add to cart, tap quantity, tap customer phone
9. Process payment
10. Receipt shows: "Beef Burger ........ KES 150"

*"And that's it. Easy for your staff, clear for customers, and I get real-time reports. Ready to try?"*

---

## Next Steps After Closing the Deal

1. **Day 1 of implementation:**
   - Add their full menu (20-30 items)
   - Train staff (1-2 hours)
   - Do 5-10 test transactions

2. **Day 3:**
   - Check analytics
   - Get feedback from staff
   - Make any tweaks

3. **Week 1:**
   - Monitor smooth operation
   - Provide support as needed

4. **Week 2:**
   - Show them the reports
   - Highlight savings
   - Lock in continuation

---

**Good luck with the meeting! You've got this! 🚀**
