const mysql = require("mysql2");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  ssl: {
    ca: fs.readFileSync(
      path.join(__dirname, "../certs/isrgrootx1.pem")
    ),
  },
});

console.log("✅ TiDB Pool Ready");

module.exports = db;