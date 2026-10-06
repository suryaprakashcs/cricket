const jwt = require("jsonwebtoken");
const Player = require("../models/playerModel");
const { ALLOWED_ROLES } = require("../models/playerModel");

const signToken = (player) => {
  return jwt.sign(
    { id: player._id, role: player.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
};

const sendTokenResponse = (player, statusCode, res, message) => {
  const token = signToken(player);
  res.status(statusCode).json({
    message,
    token,
    data: player.toJSON(),
  });
};

// POST /api/auth/register
// Public, but only admins (via Bearer token) may assign coach/captain/admin roles.
// Everyone else is forced to "player".
const register = async (req, res) => {
  try {
    const { name, age, playerRole, batting, bowling, jerseyNumber, city, phoneNumber, password } =
      req.body;

    if (!name || !age || !playerRole || !phoneNumber || !password) {
      return res.status(400).json({
        message: "name, age, playerRole, phoneNumber and password are required",
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const existing = await Player.findOne({ phoneNumber: phoneNumber.trim() });
    if (existing) {
      return res.status(409).json({ message: "Phone number already registered" });
    }

    let role = "player";
    if (
      req.body.role &&
      req.user &&
      req.user.role === "admin" &&
      ALLOWED_ROLES.includes(req.body.role)
    ) {
      role = req.body.role;
    }

    const player = await Player.create({
      name,
      age,
      playerRole,
      batting,
      bowling,
      jerseyNumber,
      city,
      phoneNumber: phoneNumber.trim(),
      password,
      role,
    });

    sendTokenResponse(player, 201, res, "Registered successfully");
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login  { phoneNumber, password }
const login = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;

    if (!phoneNumber || !password) {
      return res
        .status(400)
        .json({ message: "phoneNumber and password are required" });
    }

    const player = await Player.findOne({
      phoneNumber: String(phoneNumber).trim(),
    }).select("+password");

    if (!player) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await player.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    sendTokenResponse(player, 200, res, "Logged in successfully");
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me  (protect)
const getMe = async (req, res) => {
  res.status(200).json({
    message: "Profile fetched successfully",
    data: req.user.toJSON(),
  });
};

module.exports = { register, login, getMe };
