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
      return res.status(500).json({
        success: false,
        message: "Database error"
      });
    }

    if (result.length > 0) {
      res.json({
        success: true,
        message: "Login successful",   // ✅ ADD THIS
        user: result[0]
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }
  });
});   
// ✅ ADD MEMBER API
app.post("/add-member", (req, res) => {
  console.log("📥 Incoming:", req.body);

  const {
    family_id,
    name,
    age,
    relation,
    parent_id,
    phone,
    address,
    business_address,
    education,
    hobbies
  } = req.body;

  const sql = `
    INSERT INTO members 
    (family_id, name, age, relation, parent_id, phone, address, business_address, education, hobbies)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
    family_id,
    name,
    age,
    relation,
    parent_id,
    phone,
    address,
    business_address,
    education,
    hobbies
  ], (err, result) => {
    if (err) {
      console.log("❌ DB ERROR:", err);
      return res.json({ message: "Error adding member" });
    }

    console.log("✅ Member added");
    res.json({ message: "Member added successfully" });
  });
});
// ✅ GET MEMBERS API
app.get("/members/:id", (req, res) => {
  const family_id = req.params.id;

  const sql = "SELECT * FROM members WHERE family_id = ?";

  db.query(sql, [family_id], (err, result) => {
    if (err) {
      console.log("❌ Fetch error:", err);
      return res.json([]);
    }

    console.log("📤 Members:", result); // debug

    res.json(result);
  });
});

// ✅ START SERVER
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});