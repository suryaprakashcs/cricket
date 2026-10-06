const express = require("express");
const router = express.Router();

const { register, login, getMe } = require("../controllers/authController");
const { protect, optionalAuth } = require("../Middleware/auth");

router.post("/register", optionalAuth, register);
router.post("/login", login);
router.get("/me", protect, getMe);

module.exports = router;
