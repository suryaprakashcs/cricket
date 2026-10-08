const express = require("express");
const router = express.Router();

const {
  createMatch,
  getMatches,
  getMatch,
  updateMatch,
  cancelMatch,
  getAvailability,
  respondAvailability,
  remindPending,
  selectSquad,
  announceSquad,
  recordResult,
  history,
  teamStats,
  playerStats,
} = require("../controllers/matchController");
const { protect, authorize } = require("../Middleware/auth");

// All match routes require login
router.use(protect);

// stats + history before /:id
router.get("/history", history);
router.get("/stats/team", teamStats);
router.get("/stats/players/:playerId", playerStats);

router.route("/").get(getMatches).post(authorize("admin", "captain"), createMatch);

router.route("/:id").get(getMatch).put(authorize("admin", "captain"), updateMatch);

router.post("/:id/cancel", authorize("admin", "captain"), cancelMatch);

// availability — MOST IMPORTANT feature
router.get("/:id/availability", getAvailability);
router.put("/:id/availability", respondAvailability);
router.post("/:id/remind", authorize("admin", "captain"), remindPending);

// squad
router.put("/:id/squad", authorize("admin", "captain"), selectSquad);
router.post("/:id/announce", authorize("admin", "captain"), announceSquad);

// result
router.patch("/:id/result", authorize("admin", "captain"), recordResult);

module.exports = router;
