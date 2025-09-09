const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'preptrack.db');

function initializeDB() {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('SQLite connection error:', err.message);
      return;
    }
    console.log('Connected to SQLite database');
  });

  // Create sample tables
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        name TEXT,
        email TEXT
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        order_id INTEGER PRIMARY KEY,
        user_id INTEGER,
        product TEXT,
        amount REAL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    // Insert sample data
    db.run(`INSERT OR REPLACE INTO users (id, name, email) VALUES
      (1, 'Alice', 'alice@example.com'),
      (2, 'Bob', 'bob@example.com'),
      (3, 'Charlie', 'charlie@example.com')`);
    db.run(`INSERT OR REPLACE INTO orders (order_id, user_id, product, amount) VALUES
      (1, 1, 'Laptop', 999.99),
      (2, 1, 'Phone', 499.99),
      (3, 2, 'Tablet', 299.99)`);
  });

  return db;
}

function resetDB(db, callback) {
  db.serialize(() => {
    db.run(`DROP TABLE IF EXISTS users`);
    db.run(`DROP TABLE IF EXISTS orders`);
    db.run(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        name TEXT,
        email TEXT
      )
    `);
    db.run(`
      CREATE TABLE orders (
        order_id INTEGER PRIMARY KEY,
        user_id INTEGER,
        product TEXT,
        amount REAL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    db.run(`INSERT INTO users (id, name, email) VALUES
      (1, 'Alice', 'alice@example.com'),
      (2, 'Bob', 'bob@example.com'),
      (3, 'Charlie', 'charlie@example.com')`);
    db.run(`INSERT INTO orders (order_id, user_id, product, amount) VALUES
      (1, 1, 'Laptop', 999.99),
      (2, 1, 'Phone', 499.99),
      (3, 2, 'Tablet', 299.99)`, callback);
  });
}

module.exports = { initializeDB, resetDB };