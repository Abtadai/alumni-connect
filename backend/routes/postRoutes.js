const router = require("express").Router();
const db = require("../config/db");
const auth = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/posts");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });
router.use(auth);
// ================= GET FEED =================
router.get("/feed", (req, res) => {
  db.query(
    "SELECT * FROM Post ORDER BY created_at DESC",
    (err, rows) => {
      if (err) return res.status(500).send(err.message);
      res.json(rows);
    }
  );
});
// ================= GET FEED =================
router.get("/feed", (req, res) => {
  const sql = `
    SELECT 
      p.post_id,
      p.post_type,
      p.content,
      p.image_url,
      p.external_link,
      p.created_at,
      p.created_by,

      u.user_id AS author_user_id

    FROM Post p
    JOIN userauth u ON p.created_by = u.user_id
    ORDER BY p.created_at DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("Feed error:", err);
      return res.status(500).send("Error fetching feed");
    }

    res.json(rows);
  });
});
// ================= CREATE POST =================
// Remember this i changed the route to "/" instead of "/create" for better RESTful design. Adjust frontend accordingly.
router.post("/", upload.single("image"), (req, res) => {
  console.log("BODY:", req.body);
  console.log("FILE:", req.file);

  const { post_type, content, external_link } = req.body;
  const userId = req.user.user_id;

  const image_url = req.file
    ? `/uploads/posts/${req.file.filename}`
    : null;

  const sql = `
    INSERT INTO Post
    (post_type, content, image_url, external_link, created_by)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      post_type,
      content,
      image_url,
      external_link || null,
      userId
    ],
    (err) => {
      if (err) {
        console.error("MySQL Error:", err);
        return res.status(500).send(err.message);
      }

      res.send("Post created");
    }
  );
});

// ================= GET POSTS BY USER (PROFILE ACTIVITY) =================
router.get("/user/:userId", (req, res) => {
  const userId = req.params.userId;

  const sql = `
SELECT
  p.*,

  CASE
    WHEN u.role='STUDENT' THEN s.full_name
    WHEN u.role='ALUMNI' THEN a.full_name
  END AS author_name,

  CASE
    WHEN u.role='STUDENT' THEN s.profile_image
    WHEN u.role='ALUMNI' THEN a.profile_image
  END AS author_image,

  u.user_id AS author_user_id

FROM post p

JOIN userauth u
  ON p.created_by = u.user_id

LEFT JOIN student s
  ON u.user_id = s.user_id

LEFT JOIN alumni_profile a
  ON u.user_id = a.user_id

WHERE u.user_id = ?

ORDER BY p.created_at DESC
`;

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error fetching user posts");
    }

    res.json(rows);
  });
});

// ================= LIKE =================
router.post("/like", (req, res) => {
  const { post_id } = req.body;
  const user_id = req.user.user_id;

  db.query(
    "INSERT INTO PostLike (post_id, user_id) VALUES (?, ?)",
    [post_id, user_id],
    (err) => {
      if (err) return res.status(500).send("Error liking post");
      res.send("Liked");
    }
  );
});

router.delete("/like", (req, res) => {
  const { post_id } = req.body;
  const user_id = req.user.user_id;

  db.query(
    "DELETE FROM PostLike WHERE post_id=? AND user_id=?",
    [post_id, user_id],
    (err) => {
      if (err) return res.status(500).send("Error unliking");
      res.send("Unliked");
    }
  );
});

// ================= LIKE COUNT =================
router.get("/:postId/likes/count", (req, res) => {
  db.query(
    "SELECT COUNT(*) AS count FROM PostLike WHERE post_id=?",
    [req.params.postId],
    (err, result) => {
      res.json({ count: result[0].count });
    }
  );
});

// ================= COMMENTS =================
router.get("/:postId/comments", (req, res) => {
  db.query(
    "SELECT * FROM PostComment WHERE post_id=?",
    [req.params.postId],
    (err, rows) => {
      res.json(rows);
    }
  );
});

router.post("/comment", (req, res) => {
  const { post_id, comment_text } = req.body;
  const user_id = req.user.user_id;

  db.query(
    "INSERT INTO PostComment (post_id, user_id, comment_text) VALUES (?, ?, ?)",
    [post_id, user_id, comment_text],
    (err) => {
      if (err) return res.status(500).send("Error commenting");
      res.send("Comment added");
    }
  );
});

// ================= COMMENT COUNT =================
router.get("/:postId/comments/count", (req, res) => {
  db.query(
    "SELECT COUNT(*) AS count FROM PostComment WHERE post_id=?",
    [req.params.postId],
    (err, result) => {
      res.json({ count: result[0].count });
    }
  );
});

// ================= DELETE POST =================
router.delete("/:postId", (req, res) => {
  const postId = req.params.postId;
  const userId = req.user.user_id;

  // only allow owner to delete
  db.query(
    "DELETE FROM Post WHERE post_id = ? AND created_by = ?",
    [postId, userId],
    (err, result) => {
      if (err) {
        console.error("Delete error:", err);
        return res.status(500).send("Delete failed");
      }

      if (result.affectedRows === 0) {
        return res.status(403).send("Not allowed to delete this post");
      }

      res.send("Post deleted successfully");
    }
  );
});

module.exports = router;