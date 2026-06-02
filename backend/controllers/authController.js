const db = require("../config/db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const createTransporter = require("../utils/mailer");
const jwt = require("jsonwebtoken");

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

        /* ================= CLEAN ERROR HANDLING ================= */
        if (err) {
          console.error("🔥 REGISTER ERROR:", err.sqlMessage || err);

          // Duplicate user (email or phone unique constraint)
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
              success: false,
              message: "User already exists",
            });
          }

          // Any other DB error
          return res.status(500).json({
            success: false,
            message: "Database error during registration",
            error: err.sqlMessage || err.message,
          });
        }

        if (!result || !result.insertId) {
          return res.status(500).json({
            success: false,
            message: "Failed to create user",
          });
        }

        const userId = result.insertId;

        /* ================= STUDENT ================= */
        if (role === "STUDENT") {
          db.query(
            `INSERT INTO student (user_id, full_name, department, batch_year)
             VALUES (?, ?, ?, ?)`,
            [userId, full_name, department, batch],
            (err) => {
              if (err) {
                console.error("Student insert error:", err.sqlMessage || err);
              }
            }
          );
        }

        /* ================= ALUMNI ================= */
        else if (role === "ALUMNI") {
          db.query(
            `INSERT INTO alumni_profile 
             (user_id, full_name, department, batch_year, company, designation)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, full_name, department, batch, company, designation],
            (err) => {
              if (err) {
                console.error("Alumni insert error:", err.sqlMessage || err);
              }
            }
          );
        }

        /* ================= EMAIL ================= */
        try {
          const transporter = await createTransporter();

          await transporter.sendMail({
            to: email,
            subject: "Verify Email",
            html: `
              <h3>Verify your email</h3>
              <a href="https://alumni-connect-md7u.onrender.com/api/auth/verify/${token}">
                Click to Verify
              </a>
            `,
          });
        } catch (mailErr) {
          console.error("Mail error:", mailErr);
        }

        return res.status(201).json({
          success: true,
          message: "Registered successfully. Check your email.",
        });
      }
    );
  } catch (error) {
    console.error("🔥 SERVER ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
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
        console.error("Login DB error:", err);
        return res.status(500).json({
          success: false,
          message: "Server error",
        });
      }

      if (!rows.length) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const user = rows[0];

      if (!user.is_verified) {
        return res.status(403).json({
          success: false,
          message: "Verify email first",
        });
      }

      if (user.is_active === 0) {
        return res.status(403).json({
          success: false,
          message: "Account deactivated",
        });
      }

      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) {
        return res.status(401).json({
          success: false,
          message: "Wrong password",
        });
      }

      if (!process.env.JWT_SECRET) {
        return res.status(500).json({
          success: false,
          message: "JWT secret missing in environment variables",
        });
      }

      const token = jwt.sign(
        {
          user_id: user.user_id,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        success: true,
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
        console.error("Verify error:", err);
        return res.status(500).json({
          success: false,
          message: "Server error",
        });
      }

      if (!result.affectedRows) {
        return res.status(400).json({
          success: false,
          message: "Invalid token",
        });
      }

      return res.json({
        success: true,
        message: "Email verified successfully",
      });
    }
  );
};