const mongoose = require("mongoose");

const playerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    playerRole: {
      type: String,
      required: true,
      enum: ["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"],
    },
    batting: {
      type: String,
      enum: ["Right-Handed", "Left-Handed"],
    },
    bowling: {
      type: String,
      enum: ["Right-Handed", "Left-Handed"],
    },
    jerseyNumber: {
      type: Number,
    },
    city: {
      type: String,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["player", "admin"],
      default: "player",
    },
  },
  {
    timestamps: true,
  },
);

const Player = mongoose.model("Player", playerSchema);

module.exports = Player;
