const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// ================= DB CONNECTION =================
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) {
    console.log("Database error:", err);
  } else {
    console.log("Database Connected ✅");
  }
});

// ================= DEFAULT ROUTE =================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ================= REGISTER =================
app.post('/register', (req, res) => {
  const { family_name, email, password } = req.body;

  const sql = "INSERT INTO families (family_name, email, password) VALUES (?, ?, ?)";

  db.query(sql, [family_name, email, password], (err, result) => {
    if (err) return res.send(err);
    res.send({ message: "Registered successfully" });
  });
});

// ================= LOGIN =================
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM families WHERE email = ? AND password = ?";

  db.query(sql, [email, password], (err, result) => {
    if (err) return res.send(err);

    if (result.length > 0) {
      res.send({
        message: "Login success",
        user: result[0]
      });
    } else {
      res.send({ message: "Invalid credentials" });
    }
  });
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
    if (err) return res.send(err);
    res.send({ message: "Member added" });
  });
});

// ================= GET MEMBERS =================
app.get('/members/:family_id', (req, res) => {
  const family_id = req.params.family_id;

  const sql = "SELECT * FROM members WHERE family_id = ?";

  db.query(sql, [family_id], (err, result) => {
    if (err) return res.send(err);
    res.send(result);
  });
});

// ================= ADMIN: VIEW ALL =================
app.get('/admin/families', (req, res) => {
  const sql = "SELECT * FROM families";

  db.query(sql, (err, result) => {
    if (err) return res.send(err);
    res.send(result);
  });
});

app.get('/admin/members', (req, res) => {
  const sql = "SELECT * FROM members";

  db.query(sql, (err, result) => {
    if (err) return res.send(err);
    res.send(result);
  });
});

// ================= SERVER =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});