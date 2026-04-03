const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// ================= DATABASE =================
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) {
    console.log("DB Error:", err);
  } else {
    console.log("Database Connected");
  }
});

// ================= HOME =================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ================= REGISTER =================
app.post('/register', async (req, res) => {
  const { family_name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO families (family_name, email, password) VALUES (?, ?, ?)",
      [family_name, email, hashedPassword],
      (err) => {
        if (err) return res.json({ success: false });
        res.json({ success: true });
      }
    );
  } catch (err) {
    res.json({ success: false });
  }
});

// ================= LOGIN (FIXED) =================
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM families WHERE email = ?",
    [email],
    async (err, result) => {

      if (err) return res.send(err);

      // ❌ USER NOT FOUND
      if (result.length === 0) {
        return res.json({
          success: false,
          message: "User not found"
        });
      }

      const user = result[0];

      // 🔐 PASSWORD CHECK
      const isMatch = await bcrypt.compare(password, user.password);

      // ❌ WRONG PASSWORD
      if (!isMatch) {
        return res.json({
          success: false,
          message: "Wrong password"
        });
      }

      // ✅ SUCCESS
      res.json({
        success: true,
        user
      });
    }
  );
});

// ================= ADD MEMBER =================
app.post('/add-member', (req, res) => {
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

  db.query(
    `INSERT INTO members 
    (family_id, name, age, relation, parent_id, phone, address, business_address, education, hobbies)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
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
    ],
    (err) => {
      if (err) return res.send(err);
      res.json({ success: true });
    }
  );
});

// ================= GET MEMBERS =================
app.get('/members/:family_id', (req, res) => {
  db.query(
    "SELECT * FROM members WHERE family_id = ?",
    [req.params.family_id],
    (err, result) => {
      if (err) return res.send(err);
      res.send(result);
    }
  );
});

// ================= ADMIN =================
app.get('/admin/families', (req, res) => {
  db.query("SELECT * FROM families", (err, result) => {
    if (err) return res.send(err);
    res.send(result);
  });
});

app.get('/admin/members', (req, res) => {
  db.query("SELECT * FROM members", (err, result) => {
    if (err) return res.send(err);
    res.send(result);
  });
});

// ================= SERVER =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});