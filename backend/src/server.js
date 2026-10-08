const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");
const playerRoutes = require("./routes/playerRoutes");
const authRoutes = require("./routes/authRoutes");
const matchRoutes = require("./routes/matchRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const { runAutoReminders } = require("./services/reminderScheduler");

const app = express();

if (!process.env.JWT_SECRET) {
  console.warn(
    "WARNING: JWT_SECRET is not set. Set it in .env — auth tokens will fail.",
  );
}

// Middleware
app.use(cors());
app.use(express.json());

// Database — only auto-connect when run directly (not when required in tests)
if (require.main === module) {
  connectDB();
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/players", playerRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// 404
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Automatic reminders: every hour, nudge pending players of matches
    // whose availability deadline falls within the next 24h.
    // Responders are never contacted. Disable with REMINDERS_OFF=true.
    if (process.env.REMINDERS_OFF !== "true") {
      setInterval(runAutoReminders, 60 * 60 * 1000);
    }
  });
}

module.exports = app;
