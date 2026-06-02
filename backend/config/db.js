const mysql = require("mysql2");
require("dotenv").config();
const fs = require("fs");
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,

  ssl: {
    // rejectUnauthorized: true
    ca: fs.readFileSync(process.env.CA)
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