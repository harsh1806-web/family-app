const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const axios = require("axios");

const app = express();

// ================= CLOUDINARY CONFIG =================
cloudinary.config({
  cloud_name: "dpc0avqb7",
  api_key: "123135447529838",
  api_secret: "_1k2P4X5sgqP1cQ0qz8Ikbp244Y"
});

// ✅ Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "family_app",
    allowed_formats: ["jpg", "png", "jpeg"]
  }
});

const upload = multer({ storage });

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ================= DATABASE =================
const db = mysql.createConnection(
  "mysql://root:pzeUQzqCkHPWUYazrzQrFjMGjQLewuFo@junction.proxy.rlwy.net:30814/railway"
);

db.connect((err) => {
  if (err) {
    console.log("❌ DB connection failed:", err);
  } else {
    console.log("✅ Connected to Railway MySQL");
  }
});

// ================= ROUTES =================

// Home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

// ================= REGISTER =================
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  const checkSql = "SELECT * FROM users WHERE email = ?";
  db.query(checkSql, [email], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });

    if (result.length > 0) {
      return res.json({ message: "Email already exists" });
    }

    const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
    db.query(sql, [name, email, password], (err) => {
      if (err) return res.status(500).json({ message: err.message });

      res.json({ message: "User registered successfully" });
    });
  });
});

// ================= LOGIN =================
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email=? AND password=?";
  db.query(sql, [email, password], (err, result) => {
    if (err) return res.status(500).json({ message: err.message });

    if (result.length > 0) {
      res.json({
        success: true,
        user: result[0]
      });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  });
});

// ================= OTP =================
let otpStore = {};

app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = otp;

  try {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { name: "Family App", email: "directory.sanghavifamily@gmail.com" },
        to: [{ email }],
        subject: "OTP Code",
        htmlContent: `<h2>Your OTP: ${otp}</h2>`
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({ message: "OTP sent" });
  } catch (err) {
    res.json({ message: "Error sending OTP" });
  }
});

app.post("/reset-password", (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (otpStore[email] != otp) {
    return res.json({ message: "Invalid OTP" });
  }

  db.query(
    "UPDATE users SET password=? WHERE email=?",
    [newPassword, email],
    (err) => {
      if (err) return res.json({ message: err.message });

      delete otpStore[email];
      res.json({ message: "Password updated" });
    }
  );
});

// ================= ADD MEMBER =================
app.post("/add-member", upload.single("photo"), (req, res) => {
  console.log("BODY:", req.body);
  console.log("FILE:", req.file);

  const {
    family_id,
    name,
    dob,
    relation,
    parent_id,
    phone,
    address,
    business_address,
    education,
    hobbies
  } = req.body;

  // VALIDATION
  if (!family_id || !name || !dob || !relation) {
    return res.json({ message: "Please fill required fields" });
  }

  if (!req.file) {
    return res.json({ message: "Photo is required" });
  }

  // ✅ Cloudinary URL
  const photo = req.file.path;

  // ✅ Calculate age
  const birthDate = new Date(dob);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  // INSERT
  const sql = `
    INSERT INTO members 
    (family_id, name, age, dob, relation, parent_id, phone, address, business_address, education, hobbies, photo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [
    family_id,
    name,
    age,
    dob,
    relation,
    parent_id,
    phone,
    address,
    business_address,
    education,
    hobbies,
    photo
  ], (err) => {
    if (err) {
      console.log("❌ DB ERROR:", err);
      return res.status(500).json({ message: err.message });
    }

    res.json({ message: "Member added successfully" });
  });
});

// ================= GET MEMBERS =================
app.get("/members/:id", (req, res) => {
  const sql = "SELECT * FROM members WHERE family_id = ? ORDER BY id DESC";

  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.json([]);

    res.json(result);
  });
});

// ================= DELETE =================
app.delete("/delete-member/:id", (req, res) => {
  db.query("DELETE FROM members WHERE id=?", [req.params.id], (err) => {
    if (err) return res.json({ message: err.message });

    res.json({ message: "Deleted" });
  });
});

// ================= START =================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});