const mysql = require("mysql2");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,

  ssl: {
    // rejectUnauthorized: true
    ca: fs.readFileSync(
      path.join(__dirname, "../certs/isrgrootx1.pem")
    )
  }
});

db.connect((err) => {
  if (err) {
    console.log("❌ DB connection failed:", err);
  } else {
    console.log("✅ Connected to TiDB MySQL");
  }
});

module.exports = db;