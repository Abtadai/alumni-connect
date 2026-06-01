const router = require("express").Router();
const c = require("../controllers/chatController");
const auth = require("../middleware/auth");

router.use(auth);
router.get("/conversation", c.getConversation);
router.get("/contacts/:userId", c.getContacts);

module.exports = router;