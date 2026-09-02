const Player = require("../models/playerModel");

const createPlayer = async (req, res) => {
  try {
    const player = await Player.create(req.body);
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

module.exports = {
  createPlayer,
};
