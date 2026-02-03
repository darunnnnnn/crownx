const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
const initDB = () => {
  db.serialize(() => {
    // Users table (founders and editors)
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('founder', 'editor')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Expenses table
    db.run(`CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      date DATE NOT NULL,
      founder_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (founder_id) REFERENCES users (id)
    )`);

    // Clients table
    db.run(`CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Editors table with payment rates
    db.run(`CREATE TABLE IF NOT EXISTS editors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      rate_per_video REAL NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Video completions table
    db.run(`CREATE TABLE IF NOT EXISTS video_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      editor_id INTEGER NOT NULL,
      client_id INTEGER NOT NULL,
      completed_date DATE NOT NULL,
      month TEXT NOT NULL,
      year INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (editor_id) REFERENCES editors (id),
      FOREIGN KEY (client_id) REFERENCES clients (id)
    )`);

    // Monthly payouts table
    db.run(`CREATE TABLE IF NOT EXISTS monthly_payouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      editor_id INTEGER NOT NULL,
      month TEXT NOT NULL,
      year INTEGER NOT NULL,
      total_videos INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'paid')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (editor_id) REFERENCES editors (id)
    )`);

    // Savings table to track total savings
    db.run(`CREATE TABLE IF NOT EXISTS savings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total_amount REAL NOT NULL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Create default founders (you can change these)
    const defaultFounders = [
      { name: 'Founder 1', email: 'founder1@crownx.com', password: 'password123' },
      { name: 'Founder 2', email: 'founder2@crownx.com', password: 'password123' },
      { name: 'Founder 3', email: 'founder3@crownx.com', password: 'password123' }
    ];

    defaultFounders.forEach(founder => {
      const hashedPassword = bcrypt.hashSync(founder.password, 10);
      db.run(`INSERT OR IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, 'founder')`,
        [founder.name, founder.email, hashedPassword]);
    });

    // Initialize savings with 0
    db.run(`INSERT OR IGNORE INTO savings (id, total_amount) VALUES (1, 0)`);
  });
};

module.exports = { db, initDB };