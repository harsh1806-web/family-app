const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Serve static files
app.use(express.static(path.join(__dirname, "public")));

// ✅ Railway MySQL connection
const db = mysql.createConnection(
  "mysql://root:pzeUQzqCkHPWUYazrzQrFjMGjQLewuFo@junction.proxy.rlwy.net:30814/railway"
);

// ✅ Connect to DB
db.connect((err) => {
  if (err) {
    console.log("❌ DB connection failed:", err);
  } else {
    console.log("✅ Connected to Railway MySQL");
  }
});

// ✅ Show register page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

// ✅ REGISTER API
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  const checkSql = "SELECT * FROM users WHERE email = ?";

  db.query(checkSql, [email], (err, result) => {
    if (err) {
      console.log("❌ Check error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (result.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const insertSql =
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

    db.query(insertSql, [name, email, password], (err, result) => {
      if (err) {
        console.log("❌ Insert error:", err);
        return res.status(500).json({ message: "Insert failed" });
      }

      res.json({ message: "✅ User registered successfully" });
    });
  });
});
// ✅ LOGIN API
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ? AND password = ?";

  db.query(sql, [email, password], (err, result) => {
    if (err) {
      console.log("❌ Login error:", err);
      return res.json({ success: false });
    }

    if (result.length > 0) {
      res.json({
        success: true,
        user: result[0]   // ✅ MUST RETURN USER
      });
    } else {
      res.json({
        success: false,
        message: "Invalid credentials"
      });
    }
  });
});

// ✅ START SERVER
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});