const mongoose = require("mongoose");

const NOTIFICATION_TYPES = [
  "match_created",
  "availability_reminder",
  "squad_selected",
  "squad_reserve",
  "match_result",
  "general",
];

// In-app inbox record. Every notification is stored here — the DB is the
// source of truth, never WhatsApp. A `whatsappLink` (wa.me deep link with a
// pre-filled message) is attached where a captain may forward via WhatsApp
// manually until a WhatsApp API provider is plugged into
// services/notificationService.js.
const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },
    match: { type: mongoose.Schema.Types.ObjectId, ref: "Match" },
    type: { type: String, enum: NOTIFICATION_TYPES, default: "general" },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    link: { type: String, trim: true },
    whatsappLink: { type: String, trim: true },
    read: { type: Boolean, default: false },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
