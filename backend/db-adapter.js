/**
 * Database Adapter - Switch between SQLite (dev) and PostgreSQL (production)
 * Usage: const db = require('./db-adapter');
 */

const fs = require('fs');
require('dotenv').config();

const DB_TYPE = process.env.DB_TYPE || 'sqlite'; // 'sqlite' or 'postgres'

let db;

if (DB_TYPE === 'postgres') {
  // PostgreSQL
  const { Pool } = require('pg');
  
  const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
  });

  db = {
    run: (query, params, callback) => {
      pool.query(query, params, (err, result) => {
        if (callback) {
          if (err) {
            callback(err);
          } else {
            callback(null, result.rows);
          }
        }
      });
    },
    
    get: (query, params, callback) => {
      pool.query(query, params, (err, result) => {
        if (err) {
          callback(err);
        } else {
          callback(null, result.rows[0]);
        }
      });
    },
    
    all: (query, params, callback) => {
      pool.query(query, params, (err, result) => {
        if (err) {
          callback(err);
        } else {
          callback(null, result.rows);
        }
      });
    },
    
    serialize: (callback) => {
      callback();
    },
    
    close: (callback) => {
      pool.end(callback);
    }
  };

  console.log('✓ Using PostgreSQL database');

} else {
  // SQLite (Development)
  const sqlite3 = require('sqlite3').verbose();
  db = new sqlite3.Database(process.env.DB_PATH || './database.sqlite', (err) => {
    if (err) {
      console.error('Error opening SQLite database:', err);
    } else {
      console.log('✓ Using SQLite database');
    }
  });
}

module.exports = db;
