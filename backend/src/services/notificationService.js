const Notification = require("../models/notificationModel");

// ---------------------------------------------------------------------------
// Notification service abstraction.
//
// The application DB (Notification collection) is ALWAYS the source of truth.
// Outbound channels are pluggable providers with a single method:
//   send({ to, message }) -> Promise<void>
//
// v1 ships with the `console` provider (logs to server stdout) so the whole
// flow works end-to-end today. To integrate WhatsApp Cloud API / Twilio /
// etc. later: add a provider object here and set NOTIFY_PROVIDER=<name>.
// Nothing else in the codebase needs to change.
// ---------------------------------------------------------------------------

const providers = {
  console: {
    // eslint-disable-next-line no-unused-vars
    async send({ to, message }) {
      console.log(`[notify:${process.env.NOTIFY_PROVIDER || "console"}] to=${to}\n${message}`);
    },
  },
};

const getProvider = () => {
  const name = process.env.NOTIFY_PROVIDER || "console";
  return providers[name] || providers.console;
};

const FRONTEND_URL = () => process.env.FRONTEND_URL || "http://localhost:5173";

// Deep link that opens the availability page for a match. Included in every
// availability message so a player can tap and respond
// Available / Maybe / Not Available.
const availabilityLink = (matchId) => `${FRONTEND_URL()}/matches/${matchId}`;

// wa.me deep link so a captain can forward any message via WhatsApp manually.
// Numbers stored without country code are assumed Indian (+91).
const normalizePhone = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return digits;
};

const waLink = (phone, text) =>
  `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(text)}`;

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

// --- message builders -------------------------------------------------------

const buildMatchCreated = (match) =>
  `🏏 MATCH AVAILABILITY\n\nROYAL KINGS vs ${match.opponent}\n\n📅 ${fmtDate(match.date)}\n⏰ ${match.time}\n📍 ${match.venue}\n${match.reportingTime ? `🕗 Report by ${match.reportingTime}\n` : ""}\nPlease confirm your availability.\n\nPlease respond before ${fmtDate(match.availabilityDeadline)}.\n\nRespond here: ${availabilityLink(match._id)}`;

const buildReminder = (match, final = false) =>
  `⏰ ${final ? "FINAL REMINDER" : "REMINDER"} — MATCH AVAILABILITY\n\nROYAL KINGS vs ${match.opponent}\n📅 ${fmtDate(match.date)} ⏰ ${match.time} 📍 ${match.venue}\n\nYou haven't responded yet. Tap to confirm:\n${availabilityLink(match._id)}`;

const buildSquadXI = (match) =>
  `🏏 SQUAD ANNOUNCEMENT\n\nYou are selected in the Playing XI. 👑\n\nROYAL KINGS vs ${match.opponent}\n📅 ${fmtDate(match.date)}\n⏰ ${match.time}\n📍 ${match.venue}\n${match.reportingTime ? `\nReporting Time: ${match.reportingTime}` : ""}`;

const buildSquadReserve = (match, num) =>
  `🏏 SQUAD ANNOUNCEMENT\n\nYou are selected as Reserve #${num}. 🙏\n\nROYAL KINGS vs ${match.opponent}\n📅 ${fmtDate(match.date)}\n⏰ ${match.time}\n📍 ${match.venue}\n${match.reportingTime ? `\nReporting Time: ${match.reportingTime}` : ""}`;

const buildResult = (match) => {
  const r = match.result || {};
  const headline =
    r.outcome === "win"
      ? "🏆 ROYAL KINGS WIN!"
      : r.outcome === "loss"
        ? "😞 Kings fall short"
        : "🤝 Match over";
  return `${headline}\n\nROYAL KINGS vs ${match.opponent}\n${r.ourScore ? `Kings: ${r.ourScore}\n` : ""}${r.opponentScore ? `${match.opponent}: ${r.opponentScore}\n` : ""}${r.summary ? `\n${r.summary}` : ""}`;
};

// --- core send --------------------------------------------------------------
// Persists the inbox record first (source of truth), then fans out to the
// configured provider. Provider failures never delete the stored record.

const sendNotification = async ({
  recipientId,
  recipientPhone,
  matchId,
  type = "general",
  title,
  message,
  link,
}) => {
  const doc = await Notification.create({
    recipient: recipientId,
    match: matchId,
    type,
    title,
    message,
    link,
    whatsappLink: recipientPhone ? waLink(recipientPhone, message) : undefined,
  });

  try {
    await getProvider().send({ to: recipientPhone || String(recipientId), message });
  } catch (err) {
    console.error(`[notify] provider failed for ${recipientId}:`, err.message);
  }

  return doc;
};

module.exports = {
  sendNotification,
  availabilityLink,
  waLink,
  buildMatchCreated,
  buildReminder,
  buildSquadXI,
  buildSquadReserve,
  buildResult,
};
