const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

const dbAdapter = require('./db-adapter');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup email transporter
let emailTransporter;

function setupEmailTransporter() {
  if (process.env.EMAIL_SMTP_HOST) {
    // Custom SMTP configuration
    emailTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST,
      port: parseInt(process.env.EMAIL_SMTP_PORT || '587'),
      secure: process.env.EMAIL_SMTP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_SMTP_USER,
        pass: process.env.EMAIL_SMTP_PASSWORD
      }
    });
    console.log('Email configured with custom SMTP');
  } else if (process.env.EMAIL_SERVICE && process.env.EMAIL_FROM && process.env.EMAIL_PASSWORD) {
    // Gmail or other service
    emailTransporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    console.log(`Email configured with ${process.env.EMAIL_SERVICE}`);
  } else {
    console.warn('Email configuration incomplete. Email sending will be disabled.');
  }
}

setupEmailTransporter();

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
      business_id INTEGER DEFAULT 1,
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
      business_id INTEGER DEFAULT 1,
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
      business_id INTEGER DEFAULT 1,
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

    // Businesses table - stores multiple businesses
    db.run(`CREATE TABLE IF NOT EXISTS businesses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      pin_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) console.error('Error creating businesses table:', err);
    });

    // Authentication table - stores login PIN for this business (kept for backward compatibility)
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

    // Migrate business_auth to businesses table if needed
    db.get('SELECT COUNT(*) as count FROM businesses', (err, row) => {
      if (!err && row && row.count === 0) {
        db.all('SELECT * FROM business_auth', (err, rows) => {
          if (!err && rows && rows.length > 0) {
            rows.forEach(authRow => {
              db.run('INSERT OR IGNORE INTO businesses (id, name, pin_hash) VALUES (?, ?, ?)',
                [1, authRow.business_name, authRow.pin_hash],
                (err) => {
                  if (!err) console.log('✓ Migrated business_auth to businesses table');
                }
              );
            });
          } else {
            // No existing data, create default business
            const defaultPin = require('crypto').createHash('sha256').update('0000').digest('hex');
            db.run('INSERT OR IGNORE INTO businesses (id, name, pin_hash) VALUES (?, ?, ?)',
              [1, 'Cafeteria POS', defaultPin],
              (err) => {
                if (!err) console.log('✓ Default business created in businesses table');
              }
            );
          }
        });
      }
    });

    // Add business_id columns to existing tables if they don't exist
    const addBusinessIdColumns = () => {
      db.run(`ALTER TABLE sales ADD COLUMN business_id INTEGER DEFAULT 1`, (err) => {
        if (err && err.message.includes('duplicate')) {
          // Column already exists, that's fine
        } else if (err) {
          console.log('Info: business_id column may already exist in sales');
        } else {
          console.log('✓ Added business_id column to sales');
        }
      });

      db.run(`ALTER TABLE menu_items ADD COLUMN business_id INTEGER DEFAULT 1`, (err) => {
        if (err && err.message.includes('duplicate')) {
          // Column already exists, that's fine
        } else if (err) {
          console.log('Info: business_id column may already exist in menu_items');
        } else {
          console.log('✓ Added business_id column to menu_items');
        }
      });

      db.run(`ALTER TABLE mpesa_transactions ADD COLUMN business_id INTEGER DEFAULT 1`, (err) => {
        if (err && err.message.includes('duplicate')) {
          // Column already exists, that's fine
        } else if (err) {
          console.log('Info: business_id column may already exist in mpesa_transactions');
        } else {
          console.log('✓ Added business_id column to mpesa_transactions');
        }
      });

      db.run(`ALTER TABLE mpesa_transactions ADD COLUMN payer_name TEXT`, (err) => {
        if (err && err.message.includes('duplicate')) {
          // Column already exists, that's fine
        } else if (err) {
          console.log('Info: payer_name column may already exist in mpesa_transactions');
        } else {
          console.log('✓ Added payer_name column to mpesa_transactions');
        }
      });
    };

    // Run migration after a short delay to ensure tables exist
    setTimeout(addBusinessIdColumns, 100);

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

  // Attach business info to request
  const session = sessions.get(token);
  req.businessId = session.businessId;
  req.businessName = session.businessName;
  
  next();
}

// POST /api/auth/login - Verify PIN and get session token
app.post('/api/auth/login', (req, res) => {
  const { pin } = req.body;
  
  if (!pin) {
    return res.status(400).json({ error: 'PIN required' });
  }
  
  const pinHash = crypto.createHash('sha256').update(pin).digest('hex');
  
  // Try to find business in new businesses table first, then fall back to business_auth
  db.get('SELECT * FROM businesses WHERE pin_hash = ?', [pinHash], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (row) {
      // Create session token with business_id
      const token = crypto.randomBytes(32).toString('hex');
      const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      sessions.set(token, { expiryTime, businessId: row.id, businessName: row.name });
      
      return res.json({ 
        token, 
        businessId: row.id,
        businessName: row.name,
        message: 'Login successful' 
      });
    }

    // Fall back to business_auth for backward compatibility
    db.get('SELECT * FROM business_auth WHERE pin_hash = ?', [pinHash], (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (!row) {
        return res.status(401).json({ error: 'Invalid PIN' });
      }
      
      // Create session token with business_id = 1 (default)
      const token = crypto.randomBytes(32).toString('hex');
      const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      sessions.set(token, { expiryTime, businessId: 1, businessName: row.business_name });
      
      res.json({ 
        token, 
        businessId: 1,
        businessName: row.business_name,
        message: 'Login successful' 
      });
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
  
  // Try new businesses table first
  db.get('SELECT * FROM businesses WHERE id = ? AND pin_hash = ?', [req.businessId, oldPinHash], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (row) {
      db.run('UPDATE businesses SET pin_hash = ? WHERE id = ?', [newPinHash, req.businessId], (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'PIN changed successfully' });
      });
    } else {
      // Fall back to business_auth for backward compatibility
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
    }
  });
});

// POST /api/auth/logout - Clear session
app.post('/api/auth/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) sessions.delete(token);
  res.json({ message: 'Logged out' });
});

// POST /api/businesses - Create a new business
app.post('/api/businesses', authenticateRequest, (req, res) => {
  const { name, pin } = req.body;
  
  if (!name || !pin) {
    return res.status(400).json({ error: 'Business name and PIN required' });
  }
  
  if (name.length < 2) {
    return res.status(400).json({ error: 'Business name must be at least 2 characters' });
  }
  
  if (pin.length < 4) {
    return res.status(400).json({ error: 'PIN must be at least 4 characters' });
  }
  
  const pinHash = crypto.createHash('sha256').update(pin).digest('hex');
  
  db.run('INSERT INTO businesses (name, pin_hash) VALUES (?, ?)', [name, pinHash], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(400).json({ error: 'Business name already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
    
    const businessId = this.lastID;
    
    // Populate default menu items for the new business
    const defaultItems = [
      // Breakfast
      [businessId, 'Eggs & Toast', 150, 'Breakfast'],
      [businessId, 'Pancakes', 200, 'Breakfast'],
      [businessId, 'Oatmeal', 120, 'Breakfast'],
      [businessId, 'Tea', 50, 'Breakfast'],
      [businessId, 'Coffee', 100, 'Breakfast'],
      [businessId, 'Mandazi', 80, 'Breakfast'],
      
      // Lunch
      [businessId, 'Chapati & Beans', 250, 'Lunch'],
      [businessId, 'Rice & Stew', 300, 'Lunch'],
      [businessId, 'Ugali & Sukuma', 200, 'Lunch'],
      [businessId, 'Beef Stew', 350, 'Lunch'],
      [businessId, 'Chicken & Rice', 400, 'Lunch'],
      [businessId, 'Fish & Chips', 350, 'Lunch'],
      
      // Dinner
      [businessId, 'Roasted Chicken', 450, 'Dinner'],
      [businessId, 'Grilled Fish', 500, 'Dinner'],
      [businessId, 'Beef Nyama', 400, 'Dinner'],
      [businessId, 'Chapati', 50, 'Dinner'],
      [businessId, 'Cabbage Salad', 150, 'Dinner'],
      [businessId, 'Soda', 100, 'Dinner']
    ];

    const stmt = db.prepare('INSERT INTO menu_items (business_id, name, price, category) VALUES (?, ?, ?, ?)');
    defaultItems.forEach(item => stmt.run(item, (err) => {
      if (err) console.error('Error inserting menu item:', err);
    }));
    stmt.finalize();
    
    res.json({
      id: businessId,
      name,
      message: 'Business created successfully with default menu items'
    });
  });
});

// GET /api/businesses - List all businesses
app.get('/api/businesses', authenticateRequest, (req, res) => {
  db.all('SELECT id, name, created_at FROM businesses ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
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
  db.all('SELECT * FROM menu_items WHERE business_id = ? AND available = 1 ORDER BY category, name', [req.businessId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// GET /api/menu/all - Get ALL menu items including unavailable (for vendor management)
app.get('/api/menu/all', authenticateRequest, (req, res) => {
  db.all('SELECT * FROM menu_items WHERE business_id = ? ORDER BY category, name', [req.businessId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.post('/api/menu', authenticateRequest, (req, res) => {
  const { name, price, category, image_url } = req.body;
  db.run(
    'INSERT INTO menu_items (business_id, name, price, category, image_url) VALUES (?, ?, ?, ?, ?)',
    [req.businessId, name, price, category, image_url],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ id: this.lastID, name, price, category, image_url });
      }
    }
  );
});

app.put('/api/menu/:id', authenticateRequest, (req, res) => {
  const { id } = req.params;
  const { name, price, category, available } = req.body;
  db.run(
    'UPDATE menu_items SET name = ?, price = ?, category = ?, available = ? WHERE id = ? AND business_id = ?',
    [name, price, category, available, id, req.businessId],
    (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ success: true });
      }
    }
  );
});

app.delete('/api/menu/:id', authenticateRequest, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM menu_items WHERE id = ? AND business_id = ?', [id, req.businessId], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ success: true });
    }
  });
});

// Sales
app.post('/api/sales', authenticateRequest, (req, res) => {
  const { items, total, payment_method, mpesa_code, mpesa_transaction_id, mpesa_transaction_ids, customer_phone, student_name, vendor_id } = req.body;
  
  db.run(
    'INSERT INTO sales (business_id, items, total, payment_method, mpesa_code, mpesa_transaction_id, customer_phone, student_name, vendor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [req.businessId, JSON.stringify(items), total, payment_method, mpesa_code, mpesa_transaction_id || null, customer_phone, student_name, vendor_id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        const saleId = this.lastID;
        
        // Mark M-Pesa transactions as used
        // Handle multiple transaction IDs (new feature)
        if (mpesa_transaction_ids && mpesa_transaction_ids.trim()) {
          const transactionIds = mpesa_transaction_ids.split(',').map(id => parseInt(id.trim()));
          transactionIds.forEach(transId => {
            db.run(
              'UPDATE mpesa_transactions SET used = 1, used_in_sale_id = ? WHERE id = ? AND business_id = ?',
              [saleId, transId, req.businessId],
              (err) => {
                if (err) console.error('Error marking transaction as used:', err);
              }
            );
          });
        } 
        // Handle single transaction ID (backward compatibility)
        else if (mpesa_transaction_id) {
          db.run(
            'UPDATE mpesa_transactions SET used = 1, used_in_sale_id = ? WHERE id = ? AND business_id = ?',
            [saleId, mpesa_transaction_id, req.businessId],
            (err) => {
              if (err) console.error('Error marking transaction as used:', err);
            }
          );
        }
        
        res.json({ 
          id: saleId, 
          success: true,
          message: 'Sale recorded successfully'
        });
      }
    }
  );
});

app.get('/api/sales', authenticateRequest, (req, res) => {
  const { startDate, endDate, limit } = req.query;
  let query = 'SELECT * FROM sales WHERE business_id = ?';
  const params = [req.businessId];

  if (startDate && endDate) {
    query += ' AND created_at BETWEEN ? AND ?';
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
  
  let query = 'SELECT COUNT(*) as count, SUM(total) as revenue FROM sales WHERE business_id = ?';
  const params = [req.businessId];

  if (startDate && endDate) {
    query += ' AND created_at BETWEEN ? AND ?';
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
     WHERE business_id = ? AND created_at > ? AND used = 0
     ORDER BY created_at DESC 
     LIMIT ?`,
    [req.businessId, cutoffTime, limit],
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
     WHERE business_id = ? AND created_at > ? AND used = 0 AND payer_name LIKE ?
     ORDER BY created_at DESC`,
    [req.businessId, cutoffTime, searchName],
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
       (business_id, merchant_request_id, checkout_request_id, result_code, result_desc, amount, mpesa_receipt_number, phone_number, payer_name) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        1, // Default to business_id 1 for callbacks (can be improved with headers or config)
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
  const { amount, payerName, phoneNumber, businessId = 1 } = req.body;
  
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
     (business_id, merchant_request_id, checkout_request_id, result_code, result_desc, amount, mpesa_receipt_number, phone_number, payer_name) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      businessId,
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
    WHERE s.business_id = ?
  `;
  const params = [req.businessId];

  if (startDate && endDate) {
    query += ' AND s.created_at BETWEEN ? AND ?';
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

// ============ RECEIPT GENERATION ENDPOINTS ============

// GET /api/receipts/:saleId - Get receipt data for a specific sale
app.get('/api/receipts/:saleId', authenticateRequest, (req, res) => {
  const { saleId } = req.params;
  
  db.get('SELECT * FROM sales WHERE id = ? AND business_id = ?', [saleId, req.businessId], (err, sale) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    
    // Parse items JSON
    const items = JSON.parse(sale.items);
    
    // Get business name
    db.get('SELECT name FROM businesses WHERE id = ?', [req.businessId], (err, business) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      const receiptData = {
        id: sale.id,
        businessName: business?.name || 'Cafeteria POS',
        studentName: sale.student_name,
        items: items,
        total: sale.total,
        paymentMethod: sale.payment_method,
        mpesaCode: sale.mpesa_code,
        customerPhone: sale.customer_phone,
        date: new Date(sale.created_at).toLocaleString('en-KE'),
        receiptId: `RCP-${sale.business_id}-${sale.id}`.padStart(10, '0')
      };
      
      res.json(receiptData);
    });
  });
});

// POST /api/receipts/send-email - Send receipt via email
app.post('/api/receipts/send-email', authenticateRequest, (req, res) => {
  const { saleId, email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email address required' });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address format' });
  }
  
  // Check if email is configured
  if (!emailTransporter) {
    return res.status(503).json({ error: 'Email service is not configured. Please set EMAIL_SERVICE, EMAIL_FROM, and EMAIL_PASSWORD in environment variables.' });
  }
  
  // Get receipt data
  db.get('SELECT * FROM sales WHERE id = ? AND business_id = ?', [saleId, req.businessId], (err, sale) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    
    const items = JSON.parse(sale.items);
    const receiptId = `RCP-${sale.business_id}-${sale.id}`.padStart(10, '0');
    
    // Get business name
    db.get('SELECT name FROM businesses WHERE id = ?', [req.businessId], (err, business) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch business info' });
      }
      
      const businessName = business?.name || 'Cafeteria POS';
      
      // Generate HTML receipt
      const htmlReceipt = generateReceiptHTML({
        id: sale.id,
        businessName: businessName,
        studentName: sale.student_name,
        items: items,
        total: sale.total,
        paymentMethod: sale.payment_method,
        mpesaCode: sale.mpesa_code,
        date: new Date(sale.created_at).toLocaleString('en-KE'),
        receiptId: receiptId
      });
      
      // Send email
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@cafeteriapos.com',
        to: email,
        subject: `Your Receipt from ${businessName} - Transaction #${receiptId}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
            <div style="background-color: #f5f5f5; padding: 20px 0;">
              <!-- Email Wrapper -->
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
                
                <!-- Header Banner -->
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: 600; letter-spacing: 0.5px;">Thank You for Your Purchase</h1>
                  <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Your transaction has been completed successfully</p>
                </div>
                
                <!-- Content -->
                <div style="padding: 40px 30px;">
                  <p style="margin: 0 0 30px 0; color: #333; font-size: 16px; line-height: 1.6;">
                    Hello${sale.student_name ? ' <strong>' + sale.student_name + '</strong>' : ''},
                  </p>
                  
                  <p style="margin: 0 0 20px 0; color: #666; font-size: 15px; line-height: 1.8;">
                    We appreciate your business at <strong>${businessName}</strong>. Your transaction has been processed, and your receipt details are shown below for your records.
                  </p>
                  
                  <!-- Receipt Details Embedded -->
                  ${htmlReceipt}
                  
                  <!-- Additional Message -->
                  <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px;">
                    <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6;">
                      <strong style="color: #333;">💡 Need Help?</strong><br>
                      If you have any questions about your receipt or need assistance, please don't hesitate to contact us or speak with our staff.
                    </p>
                  </div>
                  
                  <!-- Closing -->
                  <p style="margin: 30px 0 0 0; color: #666; font-size: 15px;">
                    Thank you for choosing <strong>${businessName}</strong>. We look forward to serving you again!
                  </p>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f8f9fa; padding: 25px 30px; border-top: 1px solid #e0e0e0; text-align: center;">
                  <p style="margin: 0 0 10px 0; color: #888; font-size: 13px;">
                    <strong style="color: #333;">Transaction ID:</strong> ${receiptId}
                  </p>
                  <p style="margin: 0 0 15px 0; color: #888; font-size: 13px;">
                    ${new Date().toLocaleString('en-KE', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <div style="border-top: 1px solid #e0e0e0; padding-top: 15px; margin-top: 15px;">
                    <p style="margin: 5px 0; color: #aaa; font-size: 12px;">
                      This is an automated email. Please do not reply to this address.
                    </p>
                    <p style="margin: 5px 0 0 0; color: #aaa; font-size: 12px;">
                      © ${new Date().getFullYear()} ${businessName}. All rights reserved.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      };
      
      emailTransporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          console.error('Email sending error:', err);
          return res.status(500).json({ 
            error: 'Failed to send email',
            details: err.message 
          });
        }
        
        console.log('Email sent:', info.response);
        res.json({ 
          success: true, 
          message: `Receipt sent successfully to ${email}`,
          messageId: info.messageId
        });
      });
    });
  });
});

// Helper function to generate receipt HTML
function generateReceiptHTML(data) {
  const itemsHTML = data.items.map(item => `
    <tr style="border-bottom: 1px solid #f0f0f0;">
      <td style="padding: 12px 8px; text-align: left; color: #333; font-size: 14px;">${item.name}</td>
      <td style="padding: 12px 8px; text-align: center; color: #666; font-size: 14px;">x${item.quantity}</td>
      <td style="padding: 12px 8px; text-align: right; color: #333; font-weight: 500; font-size: 14px;">KES ${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');
  
  return `
    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin: 20px 0; border: 1px solid #e0e0e0;">
      <!-- Receipt Header -->
      <div style="text-align: center; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 2px solid #667eea;">
        <h2 style="margin: 0 0 5px 0; color: #333; font-size: 22px; font-weight: 600;">${data.businessName}</h2>
        <p style="margin: 5px 0 0 0; color: #888; font-size: 13px; letter-spacing: 0.5px;">RECEIPT</p>
        <p style="margin: 8px 0 0 0; color: #667eea; font-weight: 600; font-size: 14px;">Transaction #${data.receiptId}</p>
      </div>
      
      <!-- Receipt Information -->
      <div style="margin-bottom: 20px;">
        <table style="width: 100%; font-size: 13px; color: #666;">
          <tr style="border-bottom: 1px solid #e0e0e0;">
            <td style="padding: 8px 0;"><strong style="color: #333;">Date & Time:</strong></td>
            <td style="padding: 8px 0; text-align: right; color: #333;">${data.date}</td>
          </tr>
          ${data.studentName ? `
          <tr style="border-bottom: 1px solid #e0e0e0;">
            <td style="padding: 8px 0;"><strong style="color: #333;">Student:</strong></td>
            <td style="padding: 8px 0; text-align: right; color: #333;">${data.studentName}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0;"><strong style="color: #333;">Payment Method:</strong></td>
            <td style="padding: 8px 0; text-align: right; color: #333;">
              ${data.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Cash'}${data.mpesaCode ? ` (${data.mpesaCode})` : ''}
            </td>
          </tr>
        </table>
      </div>
      
      <!-- Items Table -->
      <div style="margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead style="background-color: #667eea; color: white;">
            <tr>
              <th style="text-align: left; padding: 10px 8px; font-weight: 600; font-size: 13px;">Item Description</th>
              <th style="text-align: center; padding: 10px 8px; font-weight: 600; font-size: 13px;">Qty</th>
              <th style="text-align: right; padding: 10px 8px; font-weight: 600; font-size: 13px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
      </div>
      
      <!-- Total Section -->
      <div style="border-top: 2px solid #667eea; border-bottom: 2px solid #667eea; padding: 15px 0; margin: 15px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 18px; font-weight: 600; color: #333;">TOTAL AMOUNT:</span>
          <span style="font-size: 24px; font-weight: 700; color: #667eea;">KES ${data.total.toFixed(2)}</span>
        </div>
      </div>
      
      <!-- Footer Message -->
      <div style="text-align: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
        <p style="margin: 0; color: #666; font-size: 13px;">✓ Transaction Complete</p>
        <p style="margin: 5px 0 0 0; color: #888; font-size: 12px;">Please retain this receipt for your records</p>
      </div>
    </div>
  `;
}

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
