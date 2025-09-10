import { Router } from 'express';
import { db } from '../database/sqlite.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const authRoutes = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Register new user
authRoutes.post('/register', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }
  
  try {
    // Check if user already exists
    db.get('SELECT id FROM users WHERE username = ?', [username], async (err, row) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (row) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Insert new user
      const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
      stmt.run([username, hashedPassword], function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to create user' });
        }
        
        // Generate JWT token
        const token = jwt.sign({ userId: this.lastID, username }, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({
          message: 'User created successfully',
          token,
          user: { id: this.lastID, username }
        });
      });
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login user
authRoutes.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user: any) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    try {
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      // Generate JWT token
      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      
      res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, username: user.username }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  });
});

// Verify token
authRoutes.get('/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    res.json({ user: { id: decoded.userId, username: decoded.username } });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});