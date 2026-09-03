const express = require("express");
const router = express.Router();
const {
  createPlayer,
  getAllPlayers,
  getPlayer,
  updatePlayer,
  deletePlayer,
} = require("../controllers/playerController");

router.post("/", createPlayer);
router.get("/", getAllPlayers);
router.get("/getById", getPlayer);
router.get("/update", updatePlayer);
router.get("/delete", deletePlayer);

module.exports = router;
