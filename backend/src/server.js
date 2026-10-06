const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");
const playerRoutes = require("./routes/playerRoutes");
const authRoutes = require("./routes/authRoutes");

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
  });
}

module.exports = app;
