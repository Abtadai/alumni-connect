const router = require("express").Router();
const db = require("../config/db");
const auth = require("../middleware/auth");

router.use(auth);
// GET EVENTS
router.get("/", (req, res) => {
  db.query("SELECT * FROM Event ORDER BY event_date DESC", (err, rows) => {
    if (err) return res.status(500).send("Error");
    res.json(rows);
  });
});

// CREATE EVENT
router.post("/", (req, res) => {
  const { title, description, event_date, venue, allowed_role, created_by } = req.body;

  db.query(
    `INSERT INTO Event (title, description, event_date, venue, allowed_role, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [title, description, event_date, venue, allowed_role, created_by],
    (err) => {
      if (err) {
        console.error("mysql error:", err);
        return res.status(500).send("Error creating event");
      }
      res.send("Event created");
    }
  );
});

// REGISTER
router.post("/register", (req, res) => {
  const { user_id, event_id } = req.body;

  db.query(
    "INSERT INTO EventRegistration (user_id, event_id) VALUES (?, ?)",
    [user_id, event_id],
    (err) => {
      if (err) return res.status(400).send("Already registered");
      res.send("Registered");
    }
  );
});

module.exports = router;