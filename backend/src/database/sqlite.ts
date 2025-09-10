import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../data/app.db');

export const db = new sqlite3.Database(dbPath);

export const initializeDatabase = () => {
  db.serialize(() => {
    // Videos table
    db.run(`
      CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        youtube_url TEXT NOT NULL,
        title TEXT,
        transcript TEXT,
        summary TEXT,
        tags TEXT,
        platform TEXT DEFAULT 'youtube',
        embedding BLOB,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add tags column if it doesn't exist (for existing databases)
    db.run(`
      ALTER TABLE videos ADD COLUMN tags TEXT
    `, (err) => {
      // Ignore error if column already exists
    });

    // Add platform column if it doesn't exist (for existing databases)
    db.run(`
      ALTER TABLE videos ADD COLUMN platform TEXT DEFAULT 'youtube'
    `, (err) => {
      // Ignore error if column already exists
    });





    // Voice notes table
    db.run(`
      CREATE TABLE IF NOT EXISTS voice_notes (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        transcript TEXT NOT NULL,
        summary TEXT,
        tags TEXT,
        duration INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Global chat messages table
    db.run(`
      CREATE TABLE IF NOT EXISTS global_chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message TEXT NOT NULL,
        response TEXT NOT NULL,
        matched_videos TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database initialized successfully');
  });
};