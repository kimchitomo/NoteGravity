import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

// Define data directory
// In Docker, we will mount /data. In local dev, we use a local folder.
const dataDir = process.env.DATA_DIR || path.join(__dirname, '../../data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const dbPath = path.join(dataDir, 'database.sqlite');
export const uploadsDir = path.join(dataDir, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database at:', dbPath);
    
    // Initialize tables
    db.serialize(() => {
      // We will store the Zustand state as a JSON string per key (e.g. tree-store, canvas-store)
      db.run(`
        CREATE TABLE IF NOT EXISTS state (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Table for metadata of chunked files
      db.run(`
        CREATE TABLE IF NOT EXISTS files (
          id TEXT PRIMARY KEY,
          filename TEXT NOT NULL,
          mimetype TEXT,
          size INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    });
  }
});

export default db;
