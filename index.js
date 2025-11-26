const express = require("express");
const app = express();
const pool = require("./config/db");
const cors = require("cors");
const port = 3000;
const dotenv = require("dotenv");
const userService = require('./services/userService');

dotenv.config({ quiet: true });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const apiUrl = "/api/v1";

// test connection to database - curl localhost:3000/api/v1/users
app.get(`${apiUrl}/users`, async (req, res) => {
  const sqlQuery = "SELECT * FROM users";
  try {
    const [rows] = await pool.execute(sqlQuery);
    res.json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Database query error" });
  }
});
// test connection to database - curl "localhost:3000/api/v1/sortedusers?order=asc"
app.get(`${apiUrl}/sortedusers`, async (req, res) => {
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

