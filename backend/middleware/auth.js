const jwt = require("jsonwebtoken");
const db = require("../config/db");

module.exports = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).send("No token");
  }

  const token = authHeader.split(" ")[1];

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded JWT:", decoded);
  } catch (err) {
    return res.status(403).send("Invalid token");
  }

  // 🔥 DB check OUTSIDE try (cleaner for async)
  db.query(
    "SELECT is_active FROM Userauth WHERE user_id=?",
    [decoded.user_id],
    (err, rows) => {
      if (err) {
        console.error("Db Error:", err);
        return res.status(500).send("DB error");
      }

      if (!rows.length) {
        return res.status(403).send("User not found");
      }

      if (!rows[0].is_active) {
        return res.status(403).send("Account deactivated");
      }

      req.user = decoded;
      next();
    }
  );
};