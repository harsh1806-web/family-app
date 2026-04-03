const express = require("express");
const mysql = require("mysql");
const cors = require("cors");

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Railway MySQL connection (PASTE YOUR VALUES)
const db = mysql.createConnection({
  host: "mysql.railway.internal",
  user: "root",
  password: "pzeUQzqCkHPWUYazrzQrFjMGjQLewuFo",
  database: "railway",
  port: PASTE_MYSQLPORT_HERE, // ⚠️ number (no quotes)
  ssl: {
    rejectUnauthorized: false
  }
});

// ✅ Connect to DB
db.connect((err) => {
  if (err) {
    console.log("❌ DB connection failed:", err);
  } else {
    console.log("✅ Connected to Railway MySQL");
  }
});

// ✅ TEST ROUTE
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// ✅ REGISTER API
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  console.log("Incoming data:", req.body);

  // 🔍 Check if email exists
  const checkSql = "SELECT * FROM users WHERE email = ?";

  db.query(checkSql, [email], (err, result) => {
    if (err) {
      console.log("❌ Check error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (result.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // ✅ Insert user
    const insertSql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

    db.query(insertSql, [name, email, password], (err, result) => {
      if (err) {
        console.log("❌ Insert error:", err);
        return res.status(500).json({ message: "Insert failed" });
      }

      res.json({ message: "✅ User registered successfully" });
    });
  });
});

// ✅ START SERVER (Render uses 10000)
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});