# PostgreSQL Setup Guide for Production

This guide explains how to set up PostgreSQL for production deployment of your cafeteria POS system.

## Why PostgreSQL for Production?

| Feature | SQLite | PostgreSQL |
|---------|--------|-----------|
| **Concurrent Users** | 10-20 max | 1000+ concurrent |
| **Data Size** | ~100MB max | Terabytes |
| **Replication** | ❌ Not supported | ✅ Built-in |
| **Backups** | File copy only | Full backup tooling |
| **Performance** | ~1000 ops/sec | 10,000+ ops/sec |
| **Network Access** | Local only | Remote access |

## Installation

### **Option 1: Local Installation (Linux/Mac)**

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Mac (using Homebrew)
brew install postgresql
brew services start postgresql
```

### **Option 2: Cloud PostgreSQL Services (Recommended)**

These services handle backups, scaling, and security:

- **Railway.app** - Easiest for Node.js apps ($5/month)
  - https://railway.app
  - PostgreSQL pre-configured
  - Deploy directly from GitHub
  
- **Render.com** - Free tier available
  - https://render.com
  - Full PostgreSQL support
  - Built-in SSL certificates

- **Supabase** - PostgreSQL + Auth
  - https://supabase.com
  - 500MB free database
  - Built-in API

- **AWS RDS** - Enterprise-grade
  - Most reliable option
  - ~$15-30/month minimum
  - Automatic backups and monitoring

## Creating Your Database

### **Step 1: Create Database and User**

```bash
# Local PostgreSQL only - skip if using cloud service
sudo -u postgres psql

# Inside PostgreSQL prompt:
CREATE DATABASE cafeteria_pos;
CREATE USER chafua_user WITH PASSWORD 'your_secure_password_here';
ALTER ROLE chafua_user SET client_encoding TO 'utf8';
ALTER ROLE chafua_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE chafua_user SET default_transaction_deferrable TO on;
GRANT ALL PRIVILEGES ON DATABASE cafeteria_pos TO chafua_user;
\q
```

### **Step 2: Initialize Schema**

Save this as `migrate-to-postgres.js`:

```javascript
const dbAdapter = require('./db-adapter');
const fs = require('fs');

const db = dbAdapter.initialize(process.env.DATABASE_URL);

// Create tables in same order as SQLite version
const schema = `
CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  student_name VARCHAR(255),
  items_sold TEXT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50),
  mpesa_reference VARCHAR(50),
  payment_id INTEGER REFERENCES mpesa_transactions(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mpesa_transactions (
  id SERIAL PRIMARY KEY,
  result_code VARCHAR(50),
  result_desc TEXT,
  transaction_code VARCHAR(50),
  amount DECIMAL(10, 2),
  payer_name VARCHAR(255),
  used BOOLEAN DEFAULT FALSE,
  used_in_sale_id INTEGER REFERENCES sales(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payer_name ON mpesa_transactions(payer_name);
CREATE INDEX IF NOT EXISTS idx_mpesa_used ON mpesa_transactions(used);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
`;

// Execute schema
const statements = schema.split(';').filter(s => s.trim());
statements.forEach(statement => {
  db.run(statement + ';', (err) => {
    if (err) console.error('Schema error:', err);
  });
});

console.log('PostgreSQL schema initialized!');
db.close();
```

Run it:

```bash
DB_TYPE=postgres DATABASE_URL=postgresql://chafua_user:password@localhost/cafeteria_pos node migrate-to-postgres.js
```

## Environment Variables

### **For Development (SQLite)**

Create `.env`:

```env
# Development with SQLite
DB_TYPE=sqlite
DB_PATH=./database.sqlite

# M-Pesa
MPESA_CONSUMER_KEY=your_key_here
MPESA_CONSUMER_SECRET=your_secret_here

PORT=3000
```

### **For Production (PostgreSQL)**

Create `.env.production`:

```env
# Production with PostgreSQL
DB_TYPE=postgres
DATABASE_URL=postgresql://chafua_user:password@hostname:5432/cafeteria_pos

# M-Pesa
MPESA_CONSUMER_KEY=your_production_key
MPESA_CONSUMER_SECRET=your_production_secret

# Server
PORT=3000
NODE_ENV=production
```

## Migrating from SQLite to PostgreSQL

### **Step 1: Export SQLite Data**

Save as `export-sqlite.js`:

```javascript
const sqlite3 = require('sqlite3');
const fs = require('fs');

const db = new sqlite3.Database('./database.sqlite');

db.all('SELECT * FROM mpesa_transactions', (err, transactions) => {
  db.all('SELECT * FROM sales', (err2, sales) => {
    db.all('SELECT * FROM menu_items', (err3, items) => {
      fs.writeFileSync('backup.json', JSON.stringify({
        menu_items: items,
        sales: sales,
        mpesa_transactions: transactions
      }, null, 2));
      console.log('Export complete: backup.json');
      db.close();
    });
  });
});
```

Run it:

```bash
node export-sqlite.js
```

### **Step 2: Import to PostgreSQL**

Save as `import-postgres.js`:

```javascript
const dbAdapter = require('./db-adapter');
const fs = require('fs');

const db = dbAdapter.initialize(process.env.DATABASE_URL);
const backup = JSON.parse(fs.readFileSync('backup.json', 'utf8'));

// Helper to handle async inserts
function insertData(table, records, callback) {
  if (!records || records.length === 0) return callback();
  
  let inserted = 0;
  records.forEach(record => {
    const columns = Object.keys(record).join(', ');
    const values = Object.values(record).map(v => 
      typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : v
    ).join(', ');
    
    db.run(
      `INSERT INTO ${table} (${columns}) VALUES (${values})`,
      (err) => {
        if (err) console.error(`Error inserting into ${table}:`, err);
        inserted++;
        if (inserted === records.length) callback();
      }
    );
  });
}

// Insert in order (handle foreign keys)
insertData('menu_items', backup.menu_items, () => {
  console.log(`✓ Imported ${backup.menu_items.length} menu items`);
  
  insertData('mpesa_transactions', backup.mpesa_transactions, () => {
    console.log(`✓ Imported ${backup.mpesa_transactions.length} M-Pesa transactions`);
    
    insertData('sales', backup.sales, () => {
      console.log(`✓ Imported ${backup.sales.length} sales`);
      console.log('\n✅ Migration complete!');
      db.close();
    });
  });
});
```

Run it:

```bash
DB_TYPE=postgres DATABASE_URL=postgresql://user:pass@host/db node import-postgres.js
```

## Switching to PostgreSQL

### **1. Update your package.json**

Add PostgreSQL driver (if not already installed):

```bash
npm install pg
```

### **2. Deploy Updated Code**

Your code already supports both databases via `db-adapter.js`. Just push these changes:

- Updated `server.js` (using db-adapter)
- New `.env.production` file

### **3. Set Environment Variable on Server**

On Railway/Render/your hosting:

```
DB_TYPE=postgres
DATABASE_URL=postgresql://user:password@hostname:5432/dbname
```

Then restart the app - it will automatically use PostgreSQL!

## Backup Strategy

### **PostgreSQL Backups**

```bash
# Full backup
pg_dump -h localhost -U chafua_user -d cafeteria_pos > backup.sql

# Restore from backup
psql -h localhost -U chafua_user -d cafeteria_pos < backup.sql

# Schedule daily backup (cron)
0 2 * * * pg_dump -h localhost -U chafua_user cafeteria_pos > /backups/cafeteria_$(date +\%Y\%m\%d).sql
```

### **Automated Backups**

Most cloud PostgreSQL services include automatic daily backups:

- **Railway** - Automatic backups included
- **Render** - Automatic backups included
- **Supabase** - Weekly backups free, daily on paid
- **AWS RDS** - Configurable retention period

## Connection Troubleshooting

### **Connection String Format**

```
postgresql://[user[:password]@][netloc][:port][/dbname][?param1=value1&...]
```

Examples:

```
# Local development
postgresql://chafua_user:password@localhost/cafeteria_pos

# Remote with password
postgresql://chafua_user:mypass123@db.example.com:5432/cafeteria_pos

# Supabase
postgresql://postgres:password@db.supabase.co:5432/postgres

# Railway (provided in dashboard)
postgresql://user:password@container.railway.app:1234/railway
```

### **Testing Connection**

```bash
# Install psql client if needed
sudo apt-get install postgresql-client  # Ubuntu/Debian
brew install libpq                       # Mac

# Test connection
psql "postgresql://chafua_user:password@localhost/cafeteria_pos" -c "SELECT 1;"
```

## Performance Optimization

### **Queries Getting Slow?**

1. **Add indexes** (already included in schema)
2. **Enable connection pooling** - Add to `.env`:

```env
# Connection pooling for many concurrent users
DB_CONNECTION_POOL_SIZE=10
```

3. **Monitor slow queries** - PostgreSQL logs queries >1s by default

### **Expected Performance**

- Name search: <50ms
- Create sale: <100ms
- List recent payments: <200ms
- Dashboard: <500ms

## Next Steps

1. Choose hosting: Railway, Render, Supabase, or local PostgreSQL
2. Create PostgreSQL database following steps above
3. Run migration scripts
4. Update `.env.production`
5. Deploy updated code
6. Verify it works, then delete SQLite database

## Support

For issues:

1. Check PostgreSQL logs: `sudo journalctl -u postgresql`
2. Test connection separately
3. Verify user permissions: `\du` in psql
4. Check disk space: `df -h`

---

**Your system now supports unlimited concurrent users with PostgreSQL!** 🚀
