const bcrypt = require("bcryptjs");
const Player = require("../models/playerModel");
const { ALLOWED_ROLES } = require("../models/playerModel");

// ADMIN creates a player profile directly (team management).
// Role can only be set by admin; others default to "player".
const createPlayer = async (req, res) => {
  try {
    const data = { ...req.body };

    if (req.user && req.user.role === "admin" && data.role) {
      if (!ALLOWED_ROLES.includes(data.role)) {
        return res.status(400).json({
          message: `Invalid role. Allowed: ${ALLOWED_ROLES.join(", ")}`,
        });
      }
    } else {
      delete data.role; // force default "player"
    }

    const player = await Player.create(data);
    res.status(201).json({
      message: "Player created successfully",
      data: player.toJSON(),
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Phone number already exists" });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

const getPlayer = async (req, res) => {
  try {
    const id = req.params.id || req.query.id;
    if (!id) {
      return res.status(400).json({ message: "Player ID is required" });
    }

    const player = await Player.findById(id);
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    res.status(200).json({
      message: "Player fetched successfully",
      data: player.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const updatePlayer = async (req, res) => {
  try {
    const id = req.params.id || req.query.id;
    if (!id) {
      return res.status(400).json({ message: "Player ID is required" });
    }

    const updates = { ...req.body };
    // Role changes go through PATCH /:id/role (admin only)
    delete updates.role;

    // findByIdAndUpdate bypasses pre('save'), so hash manually
    if (updates.password) {
      if (String(updates.password).length < 6) {
        return res
          .status(400)
          .json({ message: "Password must be at least 6 characters" });
      }
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    }

    const player = await Player.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    res.status(200).json({
      message: "Player updated successfully",
      data: player.toJSON(),
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Phone number already exists" });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

const deletePlayer = async (req, res) => {
  try {
    const id = req.params.id || req.query.id;
    if (!id) {
      return res.status(400).json({ message: "Player ID is required" });
    }

    const player = await Player.findByIdAndDelete(id);
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    res.status(200).json({ message: "Player deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getAllPlayers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.playerRole) filter.playerRole = req.query.playerRole;
    // Deactivated players are hidden unless explicitly requested (admin)
    if (req.query.includeInactive !== "true") {
      filter.isActive = { $ne: false };
    }

    const players = await Player.find(filter);
    res.status(200).json({
      message: "Players fetched successfully",
      count: players.length,
      data: players.map((p) => p.toJSON()),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/players/:id/role  { role } — admin only
const updatePlayerRole = async (req, res) => {
  try {
    const id = req.params.id || req.query.id;
    const { role } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Player ID is required" });
    }
    if (!role || !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        message: `Valid role is required: ${ALLOWED_ROLES.join(", ")}`,
      });
    }

    // Prevent last-admin lockout: don't demote yourself if you're the only admin
    if (
      req.user._id.toString() === id.toString() &&
      req.user.role === "admin" &&
      role !== "admin"
    ) {
      const adminCount = await Player.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({
          message: "Cannot demote the last remaining admin",
        });
      }
    }

    const player = await Player.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true },
    );

    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    res.status(200).json({
      message: `Role updated to '${role}'`,
      data: player.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/players/:id/active { isActive } — admin only (deactivate instead of delete)
const setPlayerActive = async (req, res) => {
  try {
    const id = req.params.id || req.query.id;
    if (!id) {
      return res.status(400).json({ message: "Player ID is required" });
    }
    if (typeof req.body.isActive !== "boolean") {
      return res.status(400).json({ message: "isActive (boolean) is required" });
    }
    // Never deactivate yourself or the last admin
    if (req.user._id.toString() === id.toString() && req.body.isActive === false) {
      return res.status(400).json({ message: "You cannot deactivate your own account" });
    }
    const target = await Player.findById(id);
    if (!target) {
      return res.status(404).json({ message: "Player not found" });
    }
    if (target.role === "admin" && req.body.isActive === false) {
      const adminCount = await Player.countDocuments({ role: "admin", isActive: { $ne: false } });
      if (adminCount <= 1) {
        return res.status(400).json({ message: "Cannot deactivate the last remaining admin" });
      }
    }
    target.isActive = req.body.isActive;
    await target.save();
    res.status(200).json({
      message: req.body.isActive ? "Player reactivated" : "Player deactivated",
      data: target.toJSON(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createPlayer,
  getAllPlayers,
  getPlayer,
  deletePlayer,
  updatePlayer,
  updatePlayerRole,
  setPlayerActive,
};
