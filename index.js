const express = require("express");
const app = express();
const pool = require("./config/db");
const cors = require("cors");
const port = 3000;
const dotenv = require("dotenv");
const { authenticateToken } = require("./middleware/auth");
const { loginUser, registerUser } = require("./services/authService");

dotenv.config({ quiet: true });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const apiUrl = "/api/v1";

// Public routes
app.post(`${apiUrl}/register`, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ error: "A parameter is missing" });
    }

    const allowedRoles = ["developer", "qatester"];

    // Block admin registration
    if (role === "admin") {
      return res
        .status(403)
        .json({ error: "Admin registration is not allowed" });
    }

    // Validate role
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const result = await registerUser(username, email, password, role);
    res.json(result);
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({ error: error.message });
  }
});

app.post(`${apiUrl}/login`, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "A parameter is missing" });
    }
    const result = await loginUser(email, password);
    res.json(result);
  } catch (error) {
    console.error("Login error:", error);
    res.status(401).json({ error: error.message });
  }
});

// Protected route
app.get(`${apiUrl}/users`, authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT id, username, email, points FROM users WHERE role = ?",
      [req.user.role]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database query error" });
  }
});

// Admin-only: Get all user details (including passwords for admin view)
app.get(`${apiUrl}/admin/users`, authenticateToken, async (req, res) => {
  if (req.user.role !== "admin")
    return res.status(401).json({ error: "Not authorised" });
  try {
    const [rows] = await pool.execute("SELECT * FROM users");
    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Database query error" });
  }
});

// Admin: Delete user
app.delete(
  `${apiUrl}/admin/users/:userId`,
  authenticateToken,
  async (req, res) => {
    if (req.user.role !== "admin")
      return res.status(401).json({ error: "Not authorised" });
    try {
      const { userId } = req.params;
      const [result] = await pool.execute("DELETE FROM users WHERE id = ?", [
        userId,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  }
);

// Admin: Update user points
app.put(
  `${apiUrl}/admin/users/:userId/points`,
  authenticateToken,
  async (req, res) => {
    if (req.user.role !== "admin")
      return res.status(401).json({ error: "Not authorised" });
    try {
      const { userId } = req.params;
      const { points } = req.body;

      const [result] = await pool.execute(
        "UPDATE users SET points = ? WHERE id = ?",
        [points, userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ message: "User points updated successfully" });
    } catch (error) {
      console.error("Update points error:", error);
      res.status(500).json({ error: "Failed to update points" });
    }
  }
);

// Start server only if this file is run directly
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

module.exports = { app };
