const router = require("express").Router();
const db = require("../config/db");
const auth = require("../middleware/auth");

router.use(auth);

/* ================= GET PROFILE ================= */
router.get("/:id", (req, res) => {
  const userId = req.user.user_id;

  const sql = `
    SELECT 
      u.user_id,
      u.email,
      u.phone_number,
      u.role,

      COALESCE(a.full_name, s.full_name) AS full_name,
      COALESCE(a.batch, s.batch) AS batch,
      COALESCE(a.profile_image, s.profile_image) AS profile_image,

      a.company,
      a.designation,

      s.department

    FROM UserAuth u
    LEFT JOIN Alumni a ON u.user_id = a.user_id
    LEFT JOIN Student s ON u.user_id = s.user_id
    WHERE u.user_id = ?
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error fetching profile");
    }

    res.json(rows[0] || {});
  });
});

/* ================= UPDATE PROFILE ================= */
router.put("/:id", (req, res) => {
  const userId = req.user.user_id;

  const {
    full_name,
    phone_number,
    batch,
    company,
    designation
  } = req.body;

  // ✅ ONLY phone update (no bio)
  db.query(
    "UPDATE UserAuth SET phone_number=? WHERE user_id=?",
    [phone_number, userId],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send("User update failed");
      }

      db.query(
        "SELECT role FROM UserAuth WHERE user_id=?",
        [userId],
        (err, rows) => {
          if (err || !rows.length) {
            return res.status(500).send("User not found");
          }

          const role = rows[0].role;

          if (role === "STUDENT") {
            db.query(
              "UPDATE Student SET full_name=?, batch=? WHERE user_id=?",
              [full_name, batch, userId],
              (err) => {
                if (err) {
                  console.error(err);
                  return res.status(500).send("Student update failed");
                }

                return res.send("Profile updated");
              }
            );
          } 
          else if (role === "ALUMNI") {
            db.query(
              "UPDATE Alumni SET full_name=?, batch=?, company=?, designation=? WHERE user_id=?",
              [full_name, batch, company, designation, userId],
              (err) => {
                if (err) {
                  console.error(err);
                  return res.status(500).send("Alumni update failed");
                }

                return res.send("Profile updated");
              }
            );
          } 
          else {
            return res.send("Profile updated");
          }
        }
      );
    }
  );
});

module.exports = router;