const db = require("../config/db");

exports.search = (req, res) => {
  const { q } = req.query;

  const sql = `
    SELECT 
      u.user_id,
      u.role,

      CASE 
        WHEN u.role = 'STUDENT' THEN s.full_name
        WHEN u.role = 'ALUMNI' THEN a.full_name
      END AS full_name,

      a.designation,
      a.company

    FROM userauth u
    LEFT JOIN student s ON u.user_id = s.user_id
    LEFT JOIN alumni a ON u.user_id = a.user_id

    WHERE 
      s.full_name LIKE ?
      OR a.full_name LIKE ?
      OR a.designation LIKE ?
      OR a.company LIKE ?

    LIMIT 20
  `;

  db.query(
    sql,
    [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Search error");
      }

      res.json(rows);
    }
  );
};