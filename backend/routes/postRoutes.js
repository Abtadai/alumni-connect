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
      a.full_name AS author_name,
      a.profile_image AS author_image,
      u.user_id AS author_user_id

    FROM Post p
    JOIN Alumni a ON p.created_by = a.alumni_id
    JOIN UserAuth u ON a.user_id = u.user_id

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

module.exports = router;