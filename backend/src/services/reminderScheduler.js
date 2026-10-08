const Match = require("../models/matchModel");
const Availability = require("../models/availabilityModel");
const {
  sendNotification,
  buildReminder,
  availabilityLink,
} = require("./notificationService");

// Runs hourly from server.js. For every open match whose availability
// deadline is within the next 24h (and not already reminded in the last
// 20h), notify ONLY the pending players. Players who already responded
// are never contacted.
const runAutoReminders = async () => {
  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const cutoff = new Date(now.getTime() - 20 * 60 * 60 * 1000);

    const matches = await Match.find({
      status: "availability_open",
      availabilityDeadline: { $gte: now, $lte: in24h },
      $or: [{ lastReminderAt: null }, { lastReminderAt: { $lte: cutoff } }],
    });

    for (const match of matches) {
      const pending = await Availability.find({
        match: match._id,
        status: "pending",
      }).populate("player", "phoneNumber isActive");

      let count = 0;
      const message = buildReminder(match, false);
      for (const r of pending) {
        if (!r.player || r.player.isActive === false) continue;
        await sendNotification({
          recipientId: r.player._id,
          recipientPhone: r.player.phoneNumber,
          matchId: match._id,
          type: "availability_reminder",
          title: `Auto-reminder: ROYAL KINGS vs ${match.opponent}`,
          message,
          link: availabilityLink(match._id),
        });
        count += 1;
      }
      match.lastReminderAt = new Date();
      await match.save();
      if (count > 0) console.log(`[reminders] auto-reminded ${count} players for match ${match._id}`);
    }
  } catch (err) {
    console.error("[reminders] auto-reminder run failed:", err.message);
  }
};

module.exports = { runAutoReminders };
