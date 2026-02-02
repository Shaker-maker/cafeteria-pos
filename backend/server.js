const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const dbAdapter = require('./db-adapter');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

// Database setup
const db = dbAdapter;
console.log(`Database connected (Type: ${process.env.DB_TYPE || 'sqlite'})`);
initializeDatabase();

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    // Menu items table
    db.run(`CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      category TEXT,
      image_url TEXT,
      available BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Sales table
    db.run(`CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      items TEXT NOT NULL,
      total REAL NOT NULL,
      payment_method TEXT NOT NULL,
      mpesa_code TEXT,
      mpesa_transaction_id INTEGER,
      customer_phone TEXT,
      student_name TEXT,
      vendor_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // M-Pesa transactions table
    db.run(`CREATE TABLE IF NOT EXISTS mpesa_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      merchant_request_id TEXT,
      checkout_request_id TEXT,
      result_code INTEGER,
      result_desc TEXT,
      amount REAL,
      mpesa_receipt_number TEXT,
      phone_number TEXT,
      payer_name TEXT,
      used BOOLEAN DEFAULT 0,
      used_in_sale_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) console.error('Error creating mpesa_transactions table:', err);
    });

    // Authentication table - stores login PIN for this business
    db.run(`CREATE TABLE IF NOT EXISTS business_auth (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_name TEXT NOT NULL,
      pin_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) console.error('Error creating business_auth table:', err);
    });

    // Export history table - tracks all sales exports
    db.run(`CREATE TABLE IF NOT EXISTS export_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_date TEXT,
      end_date TEXT,
      record_count INTEGER,
      file_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) console.error('Error creating export_history table:', err);
    });

    // Initialize business auth if it doesn't exist
    db.get('SELECT COUNT(*) as count FROM business_auth', (err, row) => {
      if (!err && row && row.count === 0) {
        // Default PIN: 0000 (should be changed on first login)
        const defaultPin = require('crypto').createHash('sha256').update('0000').digest('hex');
        db.run('INSERT INTO business_auth (business_name, pin_hash) VALUES (?, ?)', 
          ['Cafeteria POS', defaultPin], 
          (err) => {
            if (!err) console.log('✓ Business auth initialized with default PIN: 0000');
          }
        );
      }
    });

    // Add payer_name column if it doesn't exist (for existing databases)
    db.run(`PRAGMA table_info(mpesa_transactions)`, (err, columns) => {
      if (!err && columns) {
        const hasPayerName = columns.some(col => col.name === 'payer_name');
        if (!hasPayerName) {
          db.run(`ALTER TABLE mpesa_transactions ADD COLUMN payer_name TEXT`, (err) => {
            if (err) {
              console.error('Error adding payer_name column:', err);
            } else {
              console.log('✓ Added payer_name column to mpesa_transactions');
            }
          });
        }
      }
    });

    // Add used column if it doesn't exist
    db.run(`PRAGMA table_info(mpesa_transactions)`, (err, columns) => {
      if (!err && columns) {
        const hasUsed = columns.some(col => col.name === 'used');
        if (!hasUsed) {
          db.run(`ALTER TABLE mpesa_transactions ADD COLUMN used BOOLEAN DEFAULT 0`, (err) => {
            if (err) {
              console.error('Error adding used column:', err);
            } else {
              console.log('✓ Added used column to mpesa_transactions');
            }
          });
        }
      }
    });

    // Add used_in_sale_id column if it doesn't exist
    db.run(`PRAGMA table_info(mpesa_transactions)`, (err, columns) => {
      if (!err && columns) {
        const hasUsedInSaleId = columns.some(col => col.name === 'used_in_sale_id');
        if (!hasUsedInSaleId) {
          db.run(`ALTER TABLE mpesa_transactions ADD COLUMN used_in_sale_id INTEGER`, (err) => {
            if (err) {
              console.error('Error adding used_in_sale_id column:', err);
            } else {
              console.log('✓ Added used_in_sale_id column to mpesa_transactions');
            }
          });
        }
      }
    });

    // Insert default menu items if table is empty
    db.get('SELECT COUNT(*) as count FROM menu_items', (err, row) => {
      if (!err && row.count === 0) {
        const defaultItems = [
          // Breakfast
          ['Eggs & Toast', 150, 'Breakfast'],
          ['Pancakes', 200, 'Breakfast'],
          ['Oatmeal', 120, 'Breakfast'],
          ['Tea', 50, 'Breakfast'],
          ['Coffee', 100, 'Breakfast'],
          ['Mandazi', 80, 'Breakfast'],
          
          // Lunch
          ['Chapati & Beans', 250, 'Lunch'],
          ['Rice & Stew', 300, 'Lunch'],
          ['Ugali & Sukuma', 200, 'Lunch'],
          ['Beef Stew', 350, 'Lunch'],
          ['Chicken & Rice', 400, 'Lunch'],
          ['Fish & Chips', 350, 'Lunch'],
          
          // Dinner
          ['Roasted Chicken', 450, 'Dinner'],
          ['Grilled Fish', 500, 'Dinner'],
          ['Beef Nyama', 400, 'Dinner'],
          ['Chapati', 50, 'Dinner'],
          ['Cabbage Salad', 150, 'Dinner'],
          ['Soda', 100, 'Dinner']
        ];

        const stmt = db.prepare('INSERT INTO menu_items (name, price, category) VALUES (?, ?, ?)');
        defaultItems.forEach(item => stmt.run(item));
        stmt.finalize();
        console.log('Default menu items added (Breakfast, Lunch, Dinner)');
      }
    });
  });
}

// ============ AUTHENTICATION SYSTEM ============
const crypto = require('crypto');

// Store active sessions (in production, use Redis or database)
const sessions = new Map();

// Middleware to verify session token
function authenticateRequest(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (!sessions.has(token)) {
    return res.status(401).json({ error: 'Session expired' });
  }
  
  next();
}

// POST /api/auth/login - Verify PIN and get session token
app.post('/api/auth/login', (req, res) => {
  const { pin } = req.body;
  
  if (!pin) {
    return res.status(400).json({ error: 'PIN required' });
  }
  
  const pinHash = crypto.createHash('sha256').update(pin).digest('hex');
  
  db.get('SELECT * FROM business_auth WHERE pin_hash = ?', [pinHash], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }
    
    // Create session token
    const token = crypto.randomBytes(32).toString('hex');
    const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    sessions.set(token, { expiryTime, businessName: row.business_name });
    
    res.json({ 
      token, 
      businessName: row.business_name,
      message: 'Login successful' 
    });
  });
});

// POST /api/auth/change-pin - Change the business PIN
app.post('/api/auth/change-pin', authenticateRequest, (req, res) => {
  const { oldPin, newPin } = req.body;
  
  if (!oldPin || !newPin) {
    return res.status(400).json({ error: 'Old and new PIN required' });
  }
  
  const oldPinHash = crypto.createHash('sha256').update(oldPin).digest('hex');
  const newPinHash = crypto.createHash('sha256').update(newPin).digest('hex');
  
  db.get('SELECT * FROM business_auth WHERE pin_hash = ?', [oldPinHash], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(401).json({ error: 'Incorrect old PIN' });
    }
    
    db.run('UPDATE business_auth SET pin_hash = ? WHERE id = ?', [newPinHash, row.id], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'PIN changed successfully' });
    });
  });
});

// POST /api/auth/logout - Clear session
app.post('/api/auth/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) sessions.delete(token);
  res.json({ message: 'Logged out' });
});

// ============ M-Pesa Integration ============
class MPesaService {
  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY;
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    this.shortcode = process.env.MPESA_SHORTCODE;
    this.passkey = process.env.MPESA_PASSKEY;
    this.environment = process.env.MPESA_ENVIRONMENT || 'sandbox';
    this.baseURL = this.environment === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke';
  }

  async getAccessToken() {
    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
      const response = await axios.get(`${this.baseURL}/oauth/v1/generate?grant_type=client_credentials`, {
        headers: {
          Authorization: `Basic ${auth}`
        }
      });
      return response.data.access_token;
    } catch (error) {
      console.error('Error getting access token:', error.message);
      throw error;
    }
  }




}

const mpesaService = new MPesaService();

// API Routes

// Menu Items
app.get('/api/menu', authenticateRequest, (req, res) => {
  db.all('SELECT * FROM menu_items WHERE available = 1 ORDER BY category, name', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.post('/api/menu', (req, res) => {
  const { name, price, category, image_url } = req.body;
  db.run(
    'INSERT INTO menu_items (name, price, category, image_url) VALUES (?, ?, ?, ?)',
    [name, price, category, image_url],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ id: this.lastID, name, price, category, image_url });
      }
    }
  );
});

app.put('/api/menu/:id', (req, res) => {
  const { id } = req.params;
  const { name, price, category, available } = req.body;
  db.run(
    'UPDATE menu_items SET name = ?, price = ?, category = ?, available = ? WHERE id = ?',
    [name, price, category, available, id],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ success: true });
      }
    }
  );
});

app.delete('/api/menu/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM menu_items WHERE id = ?', [id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ success: true });
    }
  });
});

// Sales
app.post('/api/sales', authenticateRequest, (req, res) => {
  const { items, total, payment_method, mpesa_code, mpesa_transaction_id, customer_phone, student_name, vendor_id } = req.body;
  
  db.run(
    'INSERT INTO sales (items, total, payment_method, mpesa_code, mpesa_transaction_id, customer_phone, student_name, vendor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [JSON.stringify(items), total, payment_method, mpesa_code, mpesa_transaction_id || null, customer_phone, student_name, vendor_id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        // Mark M-Pesa transaction as used if provided
        if (mpesa_transaction_id) {
          db.run(
            'UPDATE mpesa_transactions SET used = 1, used_in_sale_id = ? WHERE id = ?',
            [this.lastID, mpesa_transaction_id],
            (err) => {
              if (err) console.error('Error marking transaction as used:', err);
            }
          );
        }
        
        res.json({ 
          id: this.lastID, 
          success: true,
          message: 'Sale recorded successfully'
        });
      }
    }
  );
});

app.get('/api/sales', authenticateRequest, (req, res) => {
  const { startDate, endDate, limit } = req.query;
  let query = 'SELECT * FROM sales';
  const params = [];

  if (startDate && endDate) {
    query += ' WHERE created_at BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }

  query += ' ORDER BY created_at DESC';

  if (limit) {
    query += ' LIMIT ?';
    params.push(parseInt(limit));
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      // Parse items JSON for each sale
      const salesWithItems = rows.map(sale => ({
        ...sale,
        items: JSON.parse(sale.items)
      }));
      res.json(salesWithItems);
    }
  });
});

app.get('/api/sales/stats', authenticateRequest, (req, res) => {
  const { startDate, endDate } = req.query;
  
  let query = 'SELECT COUNT(*) as count, SUM(total) as revenue FROM sales';
  const params = [];

  if (startDate && endDate) {
    query += ' WHERE created_at BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }

  db.get(query, params, (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({
        totalSales: row.count || 0,
        totalRevenue: row.revenue || 0
      });
    }
  });
});

// Get recent M-Pesa transactions (for matching at POS) - excludes already used ones
app.get('/api/mpesa/recent', authenticateRequest, (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const minutes = parseInt(req.query.minutes) || 1440; // Last 24 hours by default
  
  const cutoffTime = new Date(Date.now() - minutes * 60 * 1000).toISOString();
  
  db.all(
    `SELECT id, amount, mpesa_receipt_number, phone_number, payer_name, created_at 
     FROM mpesa_transactions 
     WHERE created_at > ? AND used = 0
     ORDER BY created_at DESC 
     LIMIT ?`,
    [cutoffTime, limit],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows);
      }
    }
  );
});

// M-Pesa Routes
app.get('/api/mpesa/search/:studentName', authenticateRequest, (req, res) => {
  const { studentName } = req.params;
  const minutes = parseInt(req.query.minutes) || 1440; // Last 24 hours by default for broader search
  
  const cutoffTime = new Date(Date.now() - minutes * 60 * 1000).toISOString();
  const searchName = `%${studentName}%`; // For LIKE matching
  
  db.all(
    `SELECT id, amount, mpesa_receipt_number, phone_number, payer_name, created_at 
     FROM mpesa_transactions 
     WHERE created_at > ? AND used = 0 AND payer_name LIKE ?
     ORDER BY created_at DESC`,
    [cutoffTime, searchName],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows || []);
      }
    }
  );
});

app.post('/api/mpesa/callback', (req, res) => {
  console.log('M-Pesa Callback received:', JSON.stringify(req.body, null, 2));
  
  const { Body } = req.body;
  if (Body && Body.stkCallback) {
    const callback = Body.stkCallback;
    
    // Extract payer name from result_desc (e.g., "Confirmed. you have received 789.00 KES from ABC on ...")
    let payerName = 'Unknown';
    if (callback.ResultDesc) {
      const match = callback.ResultDesc.match(/from\s+([A-Za-z\s]+)\s+on/i);
      payerName = match ? match[1].trim() : 'Unknown';
    }
    
    db.run(
      `INSERT INTO mpesa_transactions 
       (merchant_request_id, checkout_request_id, result_code, result_desc, amount, mpesa_receipt_number, phone_number, payer_name) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        callback.MerchantRequestID,
        callback.CheckoutRequestID,
        callback.ResultCode,
        callback.ResultDesc,
        callback.CallbackMetadata?.Item?.find(i => i.Name === 'Amount')?.Value,
        callback.CallbackMetadata?.Item?.find(i => i.Name === 'MpesaReceiptNumber')?.Value,
        callback.CallbackMetadata?.Item?.find(i => i.Name === 'PhoneNumber')?.Value,
        payerName
      ],
      (err) => {
        if (err) {
          console.error('Error saving M-Pesa callback:', err);
        } else {
          console.log(`Payment recorded from ${payerName} - ${callback.CallbackMetadata?.Item?.find(i => i.Name === 'MpesaReceiptNumber')?.Value}`);
        }
      }
    );
  }
  
  res.json({ ResultCode: 0, ResultDesc: 'Success' });
});

// TEST ROUTE: Simulate M-Pesa payment (for development/testing only)
app.post('/api/test/simulate-mpesa', (req, res) => {
  const { amount, payerName, phoneNumber } = req.body;
  
  if (!amount || !payerName || !phoneNumber) {
    return res.status(400).json({ 
      error: 'Required fields: amount, payerName, phoneNumber' 
    });
  }
  
  // Generate fake M-Pesa data
  const timestamp = new Date();
  const mpesaCode = Math.random().toString(36).substring(2, 12).toUpperCase();
  
  db.run(
    `INSERT INTO mpesa_transactions 
     (merchant_request_id, checkout_request_id, result_code, result_desc, amount, mpesa_receipt_number, phone_number, payer_name) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'TEST_' + Date.now(),
      'TEST_' + Date.now(),
      0,
      `Confirmed. you have received ${amount}.00 KES from ${payerName} on ${timestamp.toLocaleString()}`,
      amount,
      mpesaCode,
      phoneNumber,
      payerName
    ],
    function(err) {
      if (err) {
        console.error('Error simulating M-Pesa payment:', err);
        return res.status(500).json({ error: err.message });
      }
      
      res.json({
        success: true,
        message: `Simulated payment from ${payerName}`,
        data: {
          id: this.lastID,
          amount,
          mpesa_receipt_number: mpesaCode,
          payer_name: payerName,
          phone_number: phoneNumber,
          created_at: timestamp
        }
      });
    }
  );
});

// TEST ROUTE: Get test payment suggestions
app.get('/api/test/suggestions', (req, res) => {
  const suggestions = [
    { amount: 100, payerName: 'John Kamau', phoneNumber: '254712345678' },
    { amount: 150, payerName: 'Mary Njeri', phoneNumber: '254712345679' },
    { amount: 200, payerName: 'James Muoki', phoneNumber: '254712345680' },
    { amount: 120, payerName: 'Sarah Kipchoge', phoneNumber: '254712345681' },
    { amount: 180, payerName: 'Michael Ochieng', phoneNumber: '254712345682' },
  ];
  res.json(suggestions);
});

// Export to Excel (JSON format that frontend can convert)
app.get('/api/export/sales', authenticateRequest, (req, res) => {
  const { startDate, endDate } = req.query;
  
  let query = `
    SELECT 
      s.id,
      s.student_name,
      s.items,
      s.total,
      s.payment_method,
      s.mpesa_code,
      s.mpesa_transaction_id,
      s.created_at
    FROM sales s
  `;
  const params = [];

  if (startDate && endDate) {
    query += ' WHERE s.created_at BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }

  query += ' ORDER BY s.created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      const exportData = rows.map(sale => {
        try {
          const items = JSON.parse(sale.items);
          return {
            'Sale ID': sale.id,
            'Date': new Date(sale.created_at).toLocaleString('en-KE'),
            'Student Name': sale.student_name || 'N/A',
            'Items': items.map(i => `${i.name} (Qty: ${i.quantity})`).join('; '),
            'Total Amount (KES)': sale.total,
            'Payment Method': sale.payment_method || 'N/A',
            'M-Pesa Code': sale.mpesa_code || 'N/A',
            'M-Pesa Transaction ID': sale.mpesa_transaction_id || 'N/A'
          };
        } catch (e) {
          return {
            'Sale ID': sale.id,
            'Date': new Date(sale.created_at).toLocaleString('en-KE'),
            'Student Name': sale.student_name || 'N/A',
            'Items': sale.items || 'N/A',
            'Total Amount (KES)': sale.total,
            'Payment Method': sale.payment_method || 'N/A',
            'M-Pesa Code': sale.mpesa_code || 'N/A',
            'M-Pesa Transaction ID': sale.mpesa_transaction_id || 'N/A'
          };
        }
      });
      res.json(exportData);
    }
  });
});

// Log export to history
app.post('/api/export/log', authenticateRequest, (req, res) => {
  const { startDate, endDate, recordCount, fileName } = req.body;
  
  db.run(
    `INSERT INTO export_history (start_date, end_date, record_count, file_name) 
     VALUES (?, ?, ?, ?)`,
    [startDate || null, endDate || null, recordCount, fileName],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ 
          success: true, 
          id: this.lastID,
          message: 'Export logged successfully'
        });
      }
    }
  );
});

// Get export history
app.get('/api/export/history', authenticateRequest, (req, res) => {
  const { limit = 50 } = req.query;
  
  db.all(
    `SELECT * FROM export_history ORDER BY created_at DESC LIMIT ?`,
    [parseInt(limit)],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        const exportHistory = (rows || []).map(row => ({
          id: row.id,
          startDate: row.start_date,
          endDate: row.end_date,
          recordCount: row.record_count,
          fileName: row.file_name,
          createdAt: new Date(row.created_at).toLocaleString('en-KE')
        }));
        res.json(exportHistory);
      }
    }
  );
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.MPESA_ENVIRONMENT
  });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Cafeteria POS Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💳 M-Pesa: ${process.env.MPESA_ENVIRONMENT || 'sandbox'} mode`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});
