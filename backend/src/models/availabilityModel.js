const mongoose = require("mongoose");

const AVAILABILITY_STATUS = ["pending", "available", "maybe", "not_available"];

// One record per (match, player). Created automatically for every active
// player when a match is created. "pending" = hasn't responded yet.
const availabilitySchema = new mongoose.Schema(
  {
    match: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true,
    },
    player: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },
    status: {
      type: String,
      enum: AVAILABILITY_STATUS,
      default: "pending",
    },
    respondedAt: { type: Date },
  },
  { timestamps: true },
);

availabilitySchema.index({ match: 1, player: 1 }, { unique: true });
availabilitySchema.index({ match: 1, status: 1 });

const Availability = mongoose.model("Availability", availabilitySchema);

module.exports = Availability;
module.exports.AVAILABILITY_STATUS = AVAILABILITY_STATUS;
