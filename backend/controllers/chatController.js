const db = require("../config/db");

exports.getConversation = (req, res) => {
  const { user1, user2 } = req.query;

  db.query(
    `SELECT * FROM ChatMessage
     WHERE (sender_id=? AND receiver_id=?)
     OR (sender_id=? AND receiver_id=?)
     ORDER BY sent_at`,
    [user1, user2, user2, user1],
    (err, rows) => res.json(rows)
  );
};

exports.getContacts = (req, res) => {
  const { userId } = req.params;

  db.query(
    `SELECT DISTINCT 
      CASE 
        WHEN sender_id=? THEN receiver_id 
        ELSE sender_id 
      END AS contact_id
     FROM ChatMessage 
     WHERE sender_id=? OR receiver_id=?`,
    [userId, userId, userId],
    (err, rows) => {
      if (err) {
        console.error("DB ERROR:", err);
        return res.status(500).send("Error fetching contacts");
      }

      if (!rows || rows.length === 0) {
        return res.json([]); // 🔥 prevent crash
      }

      const contacts = rows.map(r => r.contact_id);
      res.json(contacts);
    }
  );
};