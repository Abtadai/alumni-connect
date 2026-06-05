const router = require("express").Router();
const c = require("../controllers/userController");
const db = require("../config/db");
const auth = require("../middleware/auth");

router.use(auth);
/* ================= SEARCH ================= */
router.get("/search", c.search);

/* ================= GET USERS BY IDS ================= */
router.get("/by-ids", (req, res) => {
  const { ids } = req.query;

  if (!ids) return res.json([]);

  const idArray = ids.split(",").map(Number);

  const sql = `
    SELECT 
      u.user_id,
      COALESCE(a.full_name, s.full_name) AS full_name
    FROM UserAuth u
    LEFT JOIN Alumni a ON u.user_id = a.user_id
    LEFT JOIN Student s ON u.user_id = s.user_id
    WHERE u.user_id IN (?)
  `;

  db.query(sql, [idArray], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error fetching users");
    }

    res.json(rows);
  });
});

/* ================= GET SINGLE USER PROFILE ================= */
router.get("/:id", (req, res) => {
  const userId = req.params.id;

 const sql = `
SELECT
  u.user_id,
  u.email,
  u.phone_number,
  u.role,

  CASE
    WHEN u.role='STUDENT' THEN s.full_name
    WHEN u.role='ALUMNI' THEN a.full_name
  END AS full_name,

  CASE
    WHEN u.role='STUDENT' THEN s.department
    WHEN u.role='ALUMNI' THEN a.department
  END AS department,

  CASE
    WHEN u.role='STUDENT' THEN s.batch_year
    WHEN u.role='ALUMNI' THEN a.batch_year
  END AS batch_year,

  a.company,
  a.designation,

  CASE
    WHEN u.role='STUDENT' THEN s.profile_image
    WHEN u.role='ALUMNI' THEN a.profile_image
  END AS profile_image

FROM userauth u
LEFT JOIN student s
  ON u.user_id = s.user_id
LEFT JOIN alumni_profile a
  ON u.user_id = a.user_id

WHERE u.user_id = ?
`;

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error fetching profile");
    }

    if (!rows.length) {
      return res.status(404).send("User not found");
    }

    res.json(rows[0]);
  });
});

module.exports = router;