const Player = require("../models/playerModel");

// CREATE
const createPlayer = async (req, res) => {
  try {
    const player = await Player.create(req.body).select("-password -__v");
    res.status(201).json({
      message: "Player created successfully",
      data: player,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

//GET

const getPlayer = async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      res.status(400).json({
        message: "Player ID is required",
      });
    }

    const player = await Player.findById(id).select("-password -__v");

    if (!player) {
      return res.status(404).json({
        message: "Player not found",
      });
    }

    res.status(200).json({
      message: "Player fetched successfully",
      data: player,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

//UPDATE

const updatePlayer = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        message: "Player ID is required",
      });
    }

    const player = await Player.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).select("-password -__v");

    if (!player) {
      return res.status(404).json({
        message: "Player not found",
      });
    }

    res.status(200).json({
      message: "Player updated successfully",
      data: player,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// DELETE
const deletePlayer = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        message: "Player ID is required",
      });
    }

    const player = await Player.findByIdAndDelete(id);

    if (!player) {
      return res.status(404).json({
        message: "Player not found",
      });
    }

    res.status(200).json({
      message: "Player deleted successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// GET ALL PLAYERS
const getAllPlayers = async (req, res) => {
  try {
    const players = await Player.find().select("-password -__v");

    res.status(200).json({
      message: "Players fetched successfully",
      count: players.length,
      data: players,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

module.exports = {
  createPlayer,
  getAllPlayers,
  getPlayer,
  deletePlayer,
  updatePlayer,
};
