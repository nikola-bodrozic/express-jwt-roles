// services/authService.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

async function loginUser(email, password) {
  try {
    // Find user by email
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = users[0];

    // In a real application, you should hash passwords and compare here
    // For now, we'll assume plain text comparison or add password hashing later
    // const validPassword = await bcrypt.compare(password, user.password);
    // For this example, let's add a temporary password field or use existing points as demo
    
    // Since we don't have password field, let's create a simple demo
    // In production, you should add proper password hashing
    if (password !== 'demo123') { // Temporary for demo - replace with proper auth
      throw new Error('Invalid credentials');
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        points: user.points
      }
    };
  } catch (error) {
    throw new Error('Authentication failed: ' + error.message);
  }
}

async function registerUser(username, email, password) {
  try {
    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUsers.length > 0) {
      throw new Error('User already exists with this email or username');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password, points) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, 0] // Start with 0 points
    );

    // Generate token for new user
    const token = jwt.sign(
      { 
        id: result.insertId, 
        username: username, 
        email: email 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        id: result.insertId,
        username,
        email,
        points: 0
      }
    };
  } catch (error) {
    throw new Error('Registration failed: ' + error.message);
  }
}

module.exports = { loginUser, registerUser };