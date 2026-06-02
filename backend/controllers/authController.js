const db = require("../config/db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const createTransporter = require("../utils/mailer");

/* ================= REGISTER ================= */
exports.register = async (req, res) => {
  const {
    email,
    phone,
    password,
    role,
    full_name,
    department,
    batch,
    company,
    designation,
  } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(32).toString("hex");

    db.query(
      `INSERT INTO userauth 
      (email, phone_number, password_hash, role, is_verified, is_active, verification_token)
      VALUES (?, ?, ?, ?, false, true, ?)`,
      [email, phone, hash, role, token],
      async (err, result) => {
        if (err) {
          console.error("User insert error:", err);
          return res.status(400).send("User already exists");
        }

        const userId = result.insertId;

        /* ===== INSERT INTO STUDENT / ALUMNI ===== */
        if (role === "STUDENT") {
          db.query(
            `INSERT INTO Student (user_id, full_name, department, batch)
             VALUES (?, ?, ?, ?)`,
            [userId, full_name, department, batch],
            (err) => {
              if (err) {
                console.error("Student insert error:", err);
              }
            }
          );
        } else if (role === "ALUMNI") {
          db.query(
            `INSERT INTO Alumni (user_id, full_name, department, batch, company, designation)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, full_name, department, batch, company, designation],
            (err) => {
              if (err) {
                console.error("Alumni insert error:", err);
              }
            }
          );
        }

        /* ===== SEND EMAIL ===== */
        try {
          const transporter = await createTransporter();

          await transporter.sendMail({
            to: email,
            subject: "Verify Email",
            html: `<a href="https://alumni-connect-md7u.onrender.com/api/auth/verify/${token}">Verify</a>`,
          });
        } catch (mailErr) {
          console.error("Mail error:", mailErr);
        }

        res.send("Registered successfully. Check your email.");
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

/* ================= LOGIN ================= */
exports.login = (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM userauth WHERE email = ?",
    [email],
    async (err, rows) => {
      
      if (err) {
        console.error(err);
        return res.status(500).send("Server error");
      }

      if (!rows.length) return res.send("User not found");

      const user = rows[0];

      if (!user.is_verified) return res.send("Verify email");

      if (user.is_active === 0) {
        return res.status(403).send("Account deactivated");
      }

      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.send("Wrong password");

      const jwt = require("jsonwebtoken");

const token = jwt.sign(
  {
    user_id: user.user_id,
    role: user.role,
  },
  process.env.JWT_SECRET, // 👈 comes from .env
  { expiresIn: "7d" }
);

res.json({
  token,
  user_id: user.user_id,
  role: user.role,
});
    }
  );
};

/* ================= VERIFY ================= */
exports.verify = (req, res) => {
  const { token } = req.params;

  db.query(
    "UPDATE userauth SET is_verified = true WHERE verification_token = ?",
    [token],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Server error");
      }

      if (!result.affectedRows) return res.send("Invalid token");

      res.send("Email verified successfully");
    }
  );
};