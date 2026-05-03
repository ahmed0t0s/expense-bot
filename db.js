const Database = require("better-sqlite3");

const db = new Database("expenses.db");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount INTEGER,
    category TEXT,
    text TEXT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP
);
`);

module.exports = db;