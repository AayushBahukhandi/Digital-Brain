import sqlite3 from 'sqlite3';
import fs from 'fs';

console.log('🌐 Resetting cloud database...');

// For cloud deployment, we'll use the DATABASE_URL or create a new file
const dbPath = process.env.DATABASE_URL || './data/app.db';

console.log(`📁 Database path: ${dbPath}`);

// If it's a file path, delete it first
if (dbPath.startsWith('./') || dbPath.startsWith('/')) {
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('✅ Deleted existing cloud database file');
  }
}

// Create new database with updated schema
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Videos table with UUID support
  db.run(`
    CREATE TABLE videos (
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

  // Voice notes table
  db.run(`
    CREATE TABLE voice_notes (
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
    CREATE TABLE global_chat_messages (
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
    CREATE TABLE notes (
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

  // Create indexes for better performance
  db.run(`CREATE INDEX idx_videos_user_id ON videos(user_id)`);
  db.run(`CREATE INDEX idx_videos_uuid ON videos(uuid)`);
  db.run(`CREATE INDEX idx_videos_platform ON videos(platform)`);
  db.run(`CREATE INDEX idx_voice_notes_user_id ON voice_notes(user_id)`);
  db.run(`CREATE INDEX idx_chat_messages_user_id ON global_chat_messages(user_id)`);
  db.run(`CREATE INDEX idx_notes_user_id ON notes(user_id)`);

  console.log('✅ Cloud database schema created successfully');
  console.log('✅ All tables and indexes created');
});

db.close((err) => {
  if (err) {
    console.error('❌ Error closing cloud database:', err);
  } else {
    console.log('🎉 Cloud database reset completed successfully!');
    console.log('📝 New schema includes:');
    console.log('   - Videos table with UUID support');
    console.log('   - Notes table for custom and AI-generated notes');
    console.log('   - Proper user isolation');
    console.log('   - Performance indexes');
    console.log('   - Clean data structure');
  }
});
