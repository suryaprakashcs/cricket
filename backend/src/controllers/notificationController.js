const Notification = require("../models/notificationModel");

// GET /api/notifications?unreadOnly=true — my inbox
const myNotifications = async (req, res) => {
  try {
    const q = { recipient: req.user._id };
    if (req.query.unreadOnly === "true") q.read = false;
    const [items, unread] = await Promise.all([
      Notification.find(q).sort({ createdAt: -1 }).limit(50).populate("match", "opponent date venue"),
      Notification.countDocuments({ recipient: req.user._id, read: false }),
    ]);
    res.status(200).json({ message: "Notifications fetched", unread, data: items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/notifications/:id/read — mark one as read (owner only)
const markRead = async (req, res) => {
  try {
    const doc = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true },
    );
    if (!doc) return res.status(404).json({ message: "Notification not found" });
    res.status(200).json({ message: "Marked as read", data: doc });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/notifications/read-all
const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { myNotifications, markRead, markAllRead };
