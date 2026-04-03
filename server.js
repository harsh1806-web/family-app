const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// DB CONNECTION
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'family_db'
});

db.connect(err => {
  if (err) throw err;
  console.log("Database Connected");
});

// REGISTER
app.post('/register', async (req, res) => {
  const { family_name, email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO families (family_name, email, password) VALUES (?, ?, ?)",
    [family_name, email, hashed],
    () => res.send("Registered")
  );
});

// LOGIN
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM families WHERE email = ?",
    [email],
    async (err, result) => {

      if (result.length === 0) return res.send("User not found");

      const user = result[0];
      const match = await bcrypt.compare(password, user.password);

      if (!match) return res.send("Wrong password");

      const token = jwt.sign(
        { family_id: user.id, role: user.role },
        "secret"
      );

      res.send({ token, role: user.role });
    }
  );
});

// AUTH
function auth(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.send("No token");

  jwt.verify(token, "secret", (err, user) => {
    if (err) return res.send("Invalid token");
    req.user = user;
    next();
  });
}

// ADMIN CHECK
function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.send("Access denied");
  next();
}

// ADD MEMBER (UPDATED FULL DETAILS)
app.post('/add-member', auth, (req, res) => {

  const { 
    name, age, relation, parent_id,
    phone, address, business_address, education, hobbies
  } = req.body;

  db.query(
    `INSERT INTO members 
    (family_id, name, age, relation, parent_id, phone, address, business_address, education, hobbies) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      req.user.family_id,
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
    () => res.send("Member Added")
  );
});

// GET FAMILY MEMBERS
app.get('/members', auth, (req, res) => {
  db.query(
    "SELECT * FROM members WHERE family_id = ?",
    [req.user.family_id],
    (err, result) => res.send(result)
  );
});

// ADMIN: ALL FAMILIES
app.get('/admin/families', auth, adminOnly, (req, res) => {
  db.query("SELECT * FROM families", (err, result) => res.send(result));
});

// ADMIN: ALL MEMBERS
app.get('/admin/members', auth, adminOnly, (req, res) => {
  db.query("SELECT * FROM members", (err, result) => res.send(result));
});

// ADMIN: MEMBERS OF ONE FAMILY
app.get('/admin/family-members/:id', auth, adminOnly, (req, res) => {
  db.query(
    "SELECT * FROM members WHERE family_id = ?",
    [req.params.id],
    (err, result) => res.send(result)
  );
});

// START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));
});