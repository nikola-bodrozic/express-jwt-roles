const express = require("express");
const app = express();
const pool = require("./config/db");
const cors = require("cors");
const port = 3000;
const dotenv = require("dotenv");
const userService = require('./services/userService');
const { authenticateToken } = require('./middleware/auth');
const { loginUser, registerUser } = require('./services/authService');

dotenv.config({ quiet: true });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const apiUrl = "/api/v1";

// Public routes
app.post(`${apiUrl}/register`, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const result = await registerUser(username, email, password);
    res.json(result);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post(`${apiUrl}/login`, async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
});

// Protected routes - require JWT token
app.get(`${apiUrl}/users`, authenticateToken, async (req, res) => {
  const sqlQuery = "SELECT id, username, email, points FROM users";
  try {
    const [rows] = await pool.execute(sqlQuery);
    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Database query error" });
  }
});

app.get(`${apiUrl}/sortedusers`, authenticateToken, async (req, res) => {
  const sc = req.query.order?.toUpperCase() === "ASC" ? "ASC" : "DESC";
  try {
    const su = await userService.sortUsers(sc);
    res.json(su);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Start server only if this file is run directly
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

module.exports = { app };