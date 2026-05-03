const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("expenses.db");

db.run(`
CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount INTEGER,
    category TEXT,
    text TEXT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);

module.exports = db;