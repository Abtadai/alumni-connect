const router = require("express").Router();
const db = require("../config/db");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

router.use(auth);      
router.use(adminOnly);
/* ================= USERS ================= */

// GET ALL USERS
router.get("/users", (req, res) => {
  const sql = `
    SELECT user_id, email, role, is_active
    FROM userauth
    ORDER BY created_at DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error fetching users");
    }
    res.json(rows);
  });
});

// TOGGLE USER STATUS
router.patch("/users/:id/status", (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  const currentUserId = req.user.user_id;

  // BLOCK SELF-DEACTIVATION
  if (Number(id) === Number(currentUserId)) {
    return res.status(403).send("You cannot deactivate yourself");
  }

  db.query(
    "UPDATE userauth SET is_active=? WHERE user_id=?",
    [is_active, id],
    (err) => {
      if (err) return res.status(500).send("Error updating user");
      res.send("User updated");
    }
  );
});

/* ================= POSTS ================= */

// GET POSTS
router.get("/posts", (req, res) => {
  const sql = `
    SELECT * FROM Post
    ORDER BY created_at DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) return res.status(500).send("Error fetching posts");
    res.json(rows);
  });
});

// DELETE POST
router.delete("/posts/:id", (req, res) => {
  db.query(
    "DELETE FROM Post WHERE post_id=?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).send("Error deleting post");
      res.send("Post deleted");
    }
  );
});

/* ================= EVENTS ================= */

// GET EVENTS
router.get("/events", (req, res) => {
  db.query(
    "SELECT * FROM Event ORDER BY event_date DESC",
    (err, rows) => {
      if (err) return res.status(500).send("Error fetching events");
      res.json(rows);
    }
  );
});

// DELETE EVENT
router.delete("/events/:id", (req, res) => {
  db.query(
    "DELETE FROM Event WHERE event_id=?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).send("Error deleting event");
      res.send("Event deleted");
    }
  );
});

module.exports = router;