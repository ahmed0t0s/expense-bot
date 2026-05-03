const Database = require("better-sqlite3");

const db = new Database("expenses.db");

// إنشاء الجدول
db.exec(`
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount INTEGER,
    category TEXT,
    text TEXT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);

module.exports = db;