// services/userService.js
const pool = require('../config/db');

async function sortUsers(order = 'DESC') {
  const [rows] = await pool.execute(
    'SELECT id, username, email, points, role FROM users ORDER BY points ' + order
  );
  return rows;
}

module.exports = { sortUsers };