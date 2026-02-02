# 🏗️ Technical Architecture

## System Overview

The Cafeteria POS system is built with a clean separation between frontend and backend, allowing it to work both online (with full M-Pesa automation) and offline (as a standalone PWA).

```
┌─────────────────────────────────────────────────────┐
│                    Frontend Layer                    │
│  ┌──────────────────┐     ┌──────────────────────┐ │
│  │  index.html      │     │  offline.html        │ │
│  │  (Online Mode)   │     │  (Offline Mode)      │ │
│  │  - Backend API   │     │  - LocalStorage      │ │
│  │  - M-Pesa STK    │     │  - No Server         │ │
│  └────────┬─────────┘     └──────────────────────┘ │
└───────────┼──────────────────────────────────────────┘
            │
            │ HTTP/REST API
            ▼
┌─────────────────────────────────────────────────────┐
│                   Backend Layer                      │
│  ┌──────────────────────────────────────────────┐  │
│  │           Node.js + Express Server            │  │
│  │  ┌──────────────┐  ┌──────────────────────┐  │  │
│  │  │  REST API    │  │  M-Pesa Integration  │  │  │
│  │  │  Routes      │  │  - STK Push          │  │  │
│  │  │              │  │  - Query Status      │  │  │
│  │  │              │  │  - Callbacks         │  │  │
│  │  └──────┬───────┘  └──────────┬───────────┘  │  │
│  └─────────┼────────────────────┼────────────────┘  │
└────────────┼────────────────────┼───────────────────┘
             │                    │
             ▼                    ▼
    ┌────────────────┐   ┌────────────────────┐
    │  SQLite DB     │   │  Safaricom         │
    │  - Menu        │   │  Daraja API        │
    │  - Sales       │   │  (M-Pesa)          │
    │  - Transactions│   └────────────────────┘
    └────────────────┘
```

---

## Technology Stack

### Frontend
- **Pure HTML5/CSS3/JavaScript** - No frameworks, maximum compatibility
- **Progressive Web App (PWA)** capabilities
- **LocalStorage API** - Offline data persistence
- **Fetch API** - Modern HTTP requests
- **Responsive Design** - Works on phone, tablet, desktop

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **SQLite3** - Embedded database (no separate DB server needed)
- **Axios** - HTTP client for M-Pesa API calls
- **dotenv** - Environment configuration

### External APIs
- **Safaricom Daraja API** - M-Pesa integration
  - STK Push (Lipa Na M-Pesa Online)
  - Transaction Query
  - Callback handling

---

## Data Flow

### 1. Offline Mode (frontend/offline.html)

```
User Action → JavaScript Event → LocalStorage → UI Update
     ↓
  Menu Items stored in localStorage
  Sales stored in localStorage
  Export generates CSV from localStorage
```

**No server required!** All data stays on the device.

### 2. Online Mode - Regular Sale

```
1. User adds items to cart
   ↓
2. User clicks "Complete Sale"
   ↓
3. Frontend → POST /api/sales → Backend
   ↓
4. Backend saves to SQLite
   ↓
5. Backend returns success
   ↓
6. Frontend shows confirmation
```

### 3. Online Mode - M-Pesa STK Push

```
1. User selects M-Pesa payment
   ↓
2. User enters phone number
   ↓
3. Frontend → POST /api/mpesa/stk-push → Backend
   ↓
4. Backend → Daraja API (get OAuth token)
   ↓
5. Backend → Daraja API (initiate STK Push)
   ↓
6. M-Pesa sends popup to customer's phone
   ↓
7. Customer enters PIN
   ↓
8. Daraja API → POST /api/mpesa/callback → Backend
   ↓
9. Backend saves transaction to database
   ↓
10. Frontend → POST /api/sales → Backend
   ↓
11. Sale recorded with M-Pesa receipt number
```

---

## Database Schema

### Table: `menu_items`
```sql
CREATE TABLE menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  category TEXT,
  image_url TEXT,
  available BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Table: `sales`
```sql
CREATE TABLE sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  items TEXT NOT NULL,              -- JSON string
  total REAL NOT NULL,
  payment_method TEXT NOT NULL,
  mpesa_code TEXT,
  customer_phone TEXT,
  vendor_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Table: `mpesa_transactions`
```sql
CREATE TABLE mpesa_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  merchant_request_id TEXT,
  checkout_request_id TEXT,
  result_code INTEGER,
  result_desc TEXT,
  amount REAL,
  mpesa_receipt_number TEXT,
  phone_number TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

---

## API Endpoints

### Menu Management

#### `GET /api/menu`
Get all available menu items
```json
Response: [
  {
    "id": 1,
    "name": "Chapati",
    "price": 15,
    "category": "Main",
    "available": 1
  }
]
```

#### `POST /api/menu`
Add new menu item
```json
Request: {
  "name": "Samosa",
  "price": 25,
  "category": "Snacks"
}
```

#### `PUT /api/menu/:id`
Update menu item

#### `DELETE /api/menu/:id`
Delete menu item

### Sales

#### `POST /api/sales`
Record a sale
```json
Request: {
  "items": [
    {"name": "Chapati", "quantity": 2, "price": 15},
    {"name": "Tea", "quantity": 1, "price": 20}
  ],
  "total": 50,
  "payment_method": "mpesa",
  "mpesa_code": "QGH7K8J9L0",
  "customer_phone": "254712345678"
}
```

#### `GET /api/sales`
Get sales history
- Query params: `startDate`, `endDate`, `limit`

#### `GET /api/sales/stats`
Get sales statistics
```json
Response: {
  "totalSales": 150,
  "totalRevenue": 12500
}
```

### M-Pesa

#### `POST /api/mpesa/stk-push`
Initiate M-Pesa payment
```json
Request: {
  "phoneNumber": "254712345678",
  "amount": 100
}

Response: {
  "MerchantRequestID": "...",
  "CheckoutRequestID": "...",
  "ResponseCode": "0",
  "ResponseDescription": "Success..."
}
```

#### `POST /api/mpesa/query`
Check payment status
```json
Request: {
  "checkoutRequestId": "ws_CO_..."
}
```

#### `POST /api/mpesa/callback`
Receive M-Pesa payment confirmation (called by Safaricom)

### Utilities

#### `GET /api/health`
Health check endpoint

#### `GET /api/export/sales`
Export sales to JSON (converted to CSV by frontend)

---

## Security Considerations

### Environment Variables
Sensitive data is stored in `.env` file:
- M-Pesa API credentials
- Database path
- Session secrets

**Never commit `.env` to version control!**

### API Security
- Rate limiting on API endpoints
- Input validation
- SQL injection prevention (parameterized queries)
- CORS configuration

### M-Pesa Security
- OAuth 2.0 authentication
- Encrypted password transmission
- Callback URL validation
- Transaction verification

---

## Offline Capabilities

The offline version (`frontend/offline.html`) provides:

### Features
✅ Complete POS functionality  
✅ Menu management  
✅ Sales recording  
✅ Dashboard/statistics  
✅ Export to Excel (CSV)  
✅ Works without internet  

### Data Storage
- Uses browser `localStorage` API
- Data persists between sessions
- No size limits for typical usage (5-10MB available)

### Limitations
❌ No M-Pesa automation (manual code entry)  
❌ No cloud backup  
❌ Data on single device only  

### When to Use Offline Mode
- Testing/demo purposes
- Small cafeterias
- No internet connection
- Don't need M-Pesa automation

---

## Deployment Options

### 1. Local Server (Recommended for Schools)
```bash
# Run on school computer
cd backend
npm start
# Access at http://localhost:3000
```

**Pros:**
- Free
- Full control
- No internet needed (except M-Pesa)
- Fast response times

**Cons:**
- Requires a computer to stay on
- Only accessible on local network

### 2. Cloud Hosting

#### Option A: Heroku (Free Tier)
```bash
heroku create cafeteria-pos
git push heroku main
```

#### Option B: Railway
1. Connect GitHub repo
2. Deploy automatically
3. Get public URL

#### Option C: DigitalOcean/Linode ($5-10/month)
- Full VPS control
- Better performance
- Custom domain

### 3. Offline Only
Simply distribute `frontend/offline.html` to all devices.

---

## M-Pesa Integration Details

### Daraja API Setup

1. **Register at Safaricom**
   - Visit: https://developer.safaricom.co.ke
   - Create account
   - Create new app

2. **Get Credentials**
   - Consumer Key
   - Consumer Secret
   - Shortcode (Till/Paybill number)
   - Passkey (Lipa Na M-Pesa Online)

3. **Configure Callback URL**
   - Must be HTTPS in production
   - Use ngrok for local testing
   - Register URL in Daraja portal

### STK Push Flow

```
1. App → Daraja: Get OAuth token
2. Daraja → App: Access token (expires in 1 hour)
3. App → Daraja: Initiate STK Push
   - Shortcode
   - Amount
   - Phone number
   - Callback URL
4. Daraja → Customer Phone: Payment prompt
5. Customer → Daraja: Enters PIN
6. Daraja → App Callback: Payment result
7. App: Records transaction
```

### Testing

**Sandbox Mode:**
- Use test credentials
- Test phone: 254708374149
- No real money involved

**Production Mode:**
- Real M-Pesa transactions
- Set `MPESA_ENVIRONMENT=production` in `.env`

---

## Performance Considerations

### Frontend Optimization
- Minimal CSS/JS (no frameworks = smaller size)
- In-memory cart state
- Debounced API calls
- Lazy loading for sales history

### Backend Optimization
- SQLite (embedded = no network overhead)
- Connection pooling
- Query optimization
- Rate limiting to prevent abuse

### Database Size
- 1000 sales ≈ 500KB
- 10,000 sales ≈ 5MB
- SQLite handles millions of rows efficiently

### Expected Performance
- Page load: < 1 second
- Add to cart: Instant
- Complete sale: < 2 seconds
- M-Pesa STK Push: 3-10 seconds (network dependent)

---

## Scalability

### Current Capacity
- **Transactions/day:** 1000+ easily
- **Concurrent users:** 10-20
- **Database size:** Handles years of data

### Scaling Up

**Horizontal Scaling:**
- Use PostgreSQL/MySQL instead of SQLite
- Add Redis for caching
- Load balancer for multiple instances

**Vertical Scaling:**
- Increase server RAM/CPU
- Optimize database indexes
- Add database replicas

**For most schools, the default setup is sufficient!**

---

## Backup & Recovery

### Automatic Backups
```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
cp backend/database.sqlite "backups/db_$DATE.sqlite"
```

### Manual Export
- Use dashboard "Export to Excel" button
- Downloads CSV with all data
- Can be imported back if needed

### Data Recovery
```bash
# Restore from backup
cp backups/db_20260128.sqlite backend/database.sqlite
```

---

## Troubleshooting

### Common Issues

**Server won't start:**
```bash
# Check if Node.js is installed
node --version

# Check if port 3000 is available
lsof -i :3000
```

**M-Pesa not working:**
- Verify credentials in `.env`
- Check callback URL is accessible
- Ensure phone number format: 254XXXXXXXXX
- Test in sandbox first

**Database locked:**
```bash
# Close all connections and restart
pkill node
npm start
```

**Export not working:**
- Check browser console (F12)
- Try different browser
- Ensure sales exist in database

---

## Development Setup

### Prerequisites
- Node.js 14+
- npm 6+
- Git

### Local Development
```bash
# Clone repository
git clone <repo-url>
cd cafeteria-pos

# Install dependencies
cd backend
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev  # Uses nodemon for auto-restart
```

### Project Structure
```
cafeteria-pos/
├── frontend/
│   ├── index.html          # Online version
│   ├── offline.html        # Offline version
│   └── manifest.json       # PWA manifest (optional)
├── backend/
│   ├── server.js           # Main server file
│   ├── package.json        # Dependencies
│   ├── .env.example        # Config template
│   └── database.sqlite     # SQLite database (created on first run)
├── docs/
│   ├── SETUP_GUIDE.md
│   ├── TECHNICAL_ARCHITECTURE.md
│   └── DEMO_SCRIPT.md
├── README.md
├── START_HERE.md
└── deploy.sh               # Automated setup
```

---

## Contributing

We welcome contributions! Areas for improvement:

- [ ] Add tests
- [ ] PWA manifest for offline caching
- [ ] Receipt printer support
- [ ] Barcode scanner integration
- [ ] Multi-language support (Swahili)
- [ ] Dark mode
- [ ] Analytics dashboard
- [ ] SMS notifications

---

## License

MIT License - Feel free to use, modify, and distribute!

---

## Credits

Built for school cafeterias in Kenya to simplify M-Pesa payment tracking and sales management.

**Made with ❤️ for education**
