const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");const axios = require("axios");
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");
const app = express();
const multer = require("multer");

cloudinary.config({
  cloud_name: "dpc0avqb7",
  api_key: "123135447529838",
  api_secret: "_1k2P4X5sgqP1cQ0qz8Ikbp244Y"
});
let otpStore = {};

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "family-app",
    allowed_formats: ["jpg", "png", "jpeg"]
  }
});

const upload = multer({ storage: storage });

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



app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  // generate 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  console.log("OTP:", otp);

  otpStore[email] = otp;

  try {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Family App",
          email: "directory.sanghavifamily@gmail.com"
        },
        to: [
          {
            email: email
          }
        ],
        subject: "Your OTP Code",
        htmlContent: `<h2>Your OTP is ${otp}</h2>`
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({ message: "OTP sent successfully" });

  } catch (err) {
    console.log("BREVO ERROR:", err.response?.data || err.message);
    res.json({ message: "Error sending OTP" });
  }
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

  // ✅ VALIDATION
  if (!family_id || !name || !dob || !relation) {
    return res.json({ message: "Please fill required fields" });
  }

  if (!req.file) {
    return res.json({ message: "Photo is required" });
  }

  const photo = req.file ? req.file.path :null;

  // ✅ CALCULATE AGE FROM DOB
  const birthDate = new Date(dob);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  // ✅ CHECK DUPLICATE
  const checkSql = "SELECT * FROM members WHERE name = ? AND phone = ?";

  db.query(checkSql, [name, phone], (err, result) => {
    if (err) {
      console.log("❌ Check error:", err);
      return res.status(500).json({ message: err.message });
    }

    if (result.length > 0) {
      return res.json({ message: "Member already exists" });
    }

    // ✅ INSERT
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
        console.log("❌ FULL DB ERROR:", err);
        return res.status(500).json({ message: err.message });
      }

      console.log("✅ Member added successfully");
      res.json({ message: "Member added successfully" });
    });
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