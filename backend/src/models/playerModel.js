const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ALLOWED_ROLES = ["player", "captain", "admin"];

const playerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
      min: 5,
    },
    playerRole: {
      type: String,
      required: [true, "Player role is required"],
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
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },

    role: {
      type: String,
      enum: ALLOWED_ROLES,
      default: "player",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Hash password before save
playerSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare login password with hashed password
playerSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON responses
playerSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

const Player = mongoose.model("Player", playerSchema);

module.exports = Player;
module.exports.ALLOWED_ROLES = ALLOWED_ROLES;
