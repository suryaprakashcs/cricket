const mongoose = require("mongoose");

const MATCH_TYPES = ["Friendly", "League", "Tournament"];
const MATCH_STATUS = [
  "scheduled",
  "availability_open",
  "squad_announced",
  "completed",
  "cancelled",
];
const OUTCOMES = ["win", "loss", "draw", "tie", "no_result"];

const squadSchema = new mongoose.Schema(
  {
    playingXI: [{ type: mongoose.Schema.Types.ObjectId, ref: "Player" }],
    reserves: [{ type: mongoose.Schema.Types.ObjectId, ref: "Player" }],
    captain: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
    viceCaptain: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
    wicketKeeper: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
    announcedAt: { type: Date },
    announcedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
  },
  { _id: false },
);

const resultSchema = new mongoose.Schema(
  {
    ourScore: { type: String, trim: true },
    opponentScore: { type: String, trim: true },
    outcome: { type: String, enum: OUTCOMES },
    summary: { type: String, trim: true },
    manOfTheMatch: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
    recordedAt: { type: Date },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
  },
  { _id: false },
);

const matchSchema = new mongoose.Schema(
  {
    opponent: { type: String, required: [true, "Opponent is required"], trim: true },
    matchType: { type: String, enum: MATCH_TYPES, default: "Friendly" },
    date: { type: Date, required: [true, "Match date is required"] },
    time: { type: String, required: [true, "Match time is required"], trim: true },
    venue: { type: String, required: [true, "Venue is required"], trim: true },
    reportingTime: { type: String, trim: true },
    matchFee: { type: Number, default: 0, min: 0 },
    availabilityDeadline: {
      type: Date,
      required: [true, "Availability deadline is required"],
    },
    notes: { type: String, trim: true },
    status: { type: String, enum: MATCH_STATUS, default: "availability_open" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },
    squad: { type: squadSchema, default: () => ({}) },
    result: { type: resultSchema, default: undefined },
    lastReminderAt: { type: Date },
  },
  { timestamps: true },
);

matchSchema.index({ date: 1 });

const Match = mongoose.model("Match", matchSchema);

module.exports = Match;
module.exports.MATCH_TYPES = MATCH_TYPES;
module.exports.MATCH_STATUS = MATCH_STATUS;
module.exports.OUTCOMES = OUTCOMES;
