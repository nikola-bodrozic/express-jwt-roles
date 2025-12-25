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

    // Verify password using bcrypt
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      throw new Error('Invalid credentials');
    }

    // Create JWT token with role included
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        email: user.email,
        role: user.role
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
        points: user.points,
        role: user.role
      }
    };
  } catch (error) {
    throw new Error('Authentication failed: ' + error.message);
  }
}

async function registerUser(username, email, password, role) {
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

    // Insert new user with role
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password, points, role) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, 0, role]
    );

    // Generate token for new user with role
    const token = jwt.sign(
      { 
        id: result.insertId, 
        username: username, 
        email: email,
        role: role
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
        points: 0,
        role: role
      }
    };
  } catch (error) {
    throw new Error('Registration failed: ' + error.message);
  }
}

async function invalidateToken(token, userEmail) {
  try {
    // Log the invalidation attempt
    console.log(`Invalidating token for user: ${userEmail}`);
    
    // Insert the token into the blacklist
    const [result] = await pool.execute(
      'INSERT INTO sw_tokens (token, user, is_invalidated) VALUES (?, ?, ?)',
      [token, userEmail, 1]
    );
    
    return {
      message: "Token invalidated successfully",
      result
    };
  } catch (error) {
    throw new Error('Token invalidation failed: ' + error.message);
  }
}

module.exports = { loginUser, registerUser, invalidateToken };