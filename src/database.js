const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

const dataFolder = path.join(__dirname, '..', 'data')

fs.mkdirSync(dataFolder, { recursive: true })

const databasePath = path.join(dataFolder, 'chat.db')

const db = new Database(databasePath)

db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
  );
`)

module.exports = db