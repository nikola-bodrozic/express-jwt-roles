const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Authenticate JWT and attach user to request
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // 1. Verify JWT signature and expiry first (Optimization)
    const decoded = jwt.verify(token, JWT_SECRET);

    // 2. Check if token is blacklisted in database
    const [invalidated] = await pool.execute(
      'SELECT id FROM sw_tokens WHERE token = ? AND is_invalidated = 1',
      [token]
    );

    if (invalidated.length > 0) {
      return res.status(401).json({ error: 'Token has been invalidated' });
    }

    // decoded already contains: id, username, email, role
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }

    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    // Unexpected error
    console.error('JWT verification error:', err.message);
    return res.status(500).json({ error: 'Authentication service error' });
  }
}



module.exports = {
  authenticateToken,
  JWT_SECRET,
  JWT_EXPIRES_IN
};
