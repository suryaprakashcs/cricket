const express = require("express");
const router = express.Router();

const {
  myNotifications,
  markRead,
  markAllRead,
} = require("../controllers/notificationController");
const { protect } = require("../Middleware/auth");

router.use(protect);

router.get("/", myNotifications);
router.patch("/read-all", markAllRead);
router.patch("/:id/read", markRead);

module.exports = router;
