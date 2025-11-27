// services/authService.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../middleware/auth');

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

    // Verify password using bcrypt (now using actual password hashing)
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      throw new Error('Invalid credentials');
    }

    // Create JWT token with environment variable expiration
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
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
      [username, email, hashedPassword, 0]
    );

    // Generate token for new user with environment variable expiration
    const token = jwt.sign(
      { 
        id: result.insertId, 
        username: username, 
        email: email 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
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