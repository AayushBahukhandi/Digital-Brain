import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../data/app.db');

export const db = new sqlite3.Database(dbPath);

export const initializeDatabase = () => {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Videos table with UUID support
    db.run(`
      CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        user_id INTEGER,
        youtube_url TEXT NOT NULL,
        title TEXT,
        transcript TEXT,
        summary TEXT,
        tags TEXT,
        platform TEXT DEFAULT 'youtube',
        embedding BLOB,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Create indexes for better performance
    db.run(`CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id)`, (err) => {
      // Ignore error if index already exists
    });
    db.run(`CREATE INDEX IF NOT EXISTS idx_videos_uuid ON videos(uuid)`, (err) => {
      // Ignore error if index already exists
    });
    db.run(`CREATE INDEX IF NOT EXISTS idx_videos_platform ON videos(platform)`, (err) => {
      // Ignore error if index already exists
    });
    db.run(`CREATE INDEX IF NOT EXISTS idx_voice_notes_user_id ON voice_notes(user_id)`, (err) => {
      // Ignore error if index already exists
    });
    db.run(`CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id)`, (err) => {
      // Ignore error if index already exists
    });
    db.run(`CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON global_chat_messages(user_id)`, (err) => {
      // Ignore error if index already exists
    });





    // Voice notes table
    db.run(`
      CREATE TABLE IF NOT EXISTS voice_notes (
        id TEXT PRIMARY KEY,
        user_id INTEGER,
        filename TEXT NOT NULL,
        transcript TEXT NOT NULL,
        summary TEXT,
        tags TEXT,
        duration INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Global chat messages table
    db.run(`
      CREATE TABLE IF NOT EXISTS global_chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        message TEXT NOT NULL,
        response TEXT NOT NULL,
        matched_videos TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Notes table for custom notes and AI-generated notes
    db.run(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        tags TEXT,
        is_ai_generated BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    console.log('Database initialized successfully');
  });
};