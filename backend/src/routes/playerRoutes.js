const express = require("express");
const router = express.Router();

const {
  createPlayer,
  getAllPlayers,
  getPlayer,
  updatePlayer,
  deletePlayer,
  updatePlayerRole,
  setPlayerActive,
} = require("../controllers/playerController");
const { protect, authorize, allowSelfOr } = require("../Middleware/auth");

// All player routes require login
router.use(protect);

router
  .route("/")
  .get(getAllPlayers) // any logged-in user can list (supports ?role=&playerRole=)
  .post(authorize("admin"), createPlayer); // only admin can add profiles

router.patch(
  "/:id/role",
  authorize("admin"),
  updatePlayerRole,
); // role management: admin only

router.patch("/:id/active", authorize("admin"), setPlayerActive); // deactivate/reactivate: admin only

router
  .route("/:id")
  .get(getPlayer) // any logged-in user
  .put(allowSelfOr("admin"), updatePlayer) // owner or admin
  .delete(authorize("admin"), deletePlayer); // admin only

module.exports = router;
