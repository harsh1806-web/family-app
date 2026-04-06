const nodemailer = require("nodemailer");
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,   // IMPORTANT
  auth: {
   
    user: "directory.sanghavifamily@gmail.com",
   
    pass: "ihddvynqbkooijaa"
  }

});
transporter.verify((error, success) => {
  if (error) {
    console.log("❌ SMTP ERROR:", error);
  } else {
    console.log("✅ SMTP READY");
  }
});


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


let otpStore = {};
app.post("/forgot-password", (req, res) => {
  console.log("🔥 FORGOT PASSWORD API CALLED");   // 👈 ADD THIS

  const { email } = req.body;

app.post("/forgot-password", (req, res) => {
  const { email } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000);

  otpStore[email] = otp;

  console.log("OTP:", otp);

  const mailOptions = {
    from: "directory.sanghavifamily@gmail.com",
    to: email,
    subject: "Password Reset OTP",
    text: `Your OTP is: ${otp}`
  };

  console.log("📨 Sending email to:", email);
  if (err) {
    console.log("❌ EMAIL ERROR:", err);   // 👈 IMPORTANT
    return res.json({ message: "Error sending OTP" });
  }

  console.log("✅ EMAIL SENT:", info);    // 👈 IMPORTANT

  res.json({ message: "OTP sent to email" });
});
});
app.post("/reset-password", (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (otpStore[email] != otp) {
    return res.json({ message: "Invalid OTP" });
  }

  const sql = "UPDATE users SET password=? WHERE email=?";

  db.query(sql, [newPassword, email], (err) => {
    if (err) {
      console.log(err);
      return res.json({ message: "Error updating password" });
    }

    delete otpStore[email];

    res.json({ message: "Password updated successfully" });
  });
});
// ✅ ADD MEMBER API
// ✅ ADD MEMBER API (IMPROVED)
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

  // ✅ STEP A: VALIDATION
  if (!family_id || !name || !age || !relation) {
    return res.json({ message: "Please fill required fields" });
  }

  // ✅ STEP B: CHECK DUPLICATE
  const checkSql = "SELECT * FROM members WHERE name = ? AND phone = ?";

  db.query(checkSql, [name, phone], (err, result) => {
    if (err) {
      console.log("❌ Check error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (result.length > 0) {
      return res.json({ message: "Member already exists" });
    }

    // ✅ STEP C: INSERT
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
        return res.status(500).json({ message: "Error adding member" });
      }

      console.log("✅ Member added");
      res.json({ message: "Member added successfully" });
    });
  });
});
// ✅ UPDATE MEMBER API
app.put("/update-member/:id", (req, res) => {
  const id = req.params.id;

  const {
    name,
    age,
    relation,
    phone,
    address,
    business_address,
    education,
    hobbies
  } = req.body;

  const sql = `
    UPDATE members 
    SET name=?, age=?, relation=?, phone=?, address=?, business_address=?, education=?, hobbies=?
    WHERE id=?
  `;

  db.query(sql, [
    name,
    age,
    relation,
    phone,
    address,
    business_address,
    education,
    hobbies,
    id
  ], (err) => {
    if (err) {
      console.log("❌ Update error:", err);
      return res.json({ message: "Update failed" });
    }

    res.json({ message: "Member updated successfully" });
  });
});
// ✅ GET MEMBERS API
app.get("/members/:id", (req, res) => {
  const family_id = req.params.id;

  const sql = "SELECT * FROM members WHERE family_id = ? ORDER BY id DESC";

  db.query(sql, [family_id], (err, result) => {
    if (err) {
      console.log("❌ Fetch error:", err);
      return res.json([]);
    }

    console.log("📤 Members:", result); // debug

    res.json(result);
  });
});
// ✅ GET ALL FAMILIES (SECURE READY)
app.get("/families", (req, res) => {
  const sql = "SELECT id, name, email FROM users";

  db.query(sql, (err, result) => {
    if (err) {
      console.log("❌ Error fetching families:", err);
      return res.json([]);
    }

    res.json(result);
  });
});
// ✅ DELETE MEMBER
app.delete("/delete-member/:id", (req, res) => {
  const id = req.params.id;

  const sql = "DELETE FROM members WHERE id = ?";

  db.query(sql, [id], (err) => {
    if (err) {
      console.log(err);
      return res.json({ message: "Delete failed" });
    }

    res.json({ message: "Member deleted" });
  });
});

// ✅ START SERVER
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});