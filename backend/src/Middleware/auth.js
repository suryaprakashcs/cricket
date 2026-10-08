const jwt = require("jsonwebtoken");
const Player = require("../models/playerModel");

// Protect routes — requires valid JWT in Authorization: Bearer <token>
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Player.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    req.user = user; // full mongoose doc (password excluded by select:false)
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired, please log in again" });
    }
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
};

// Optional auth — attaches req.user if a valid token is present, otherwise continues as guest.
// Used by public register so an admin can create privileged accounts.
const optionalAuth = async (req, _res, next) => {
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await Player.findById(decoded.id);
      if (user) req.user = user;
    }
  } catch (_err) {
    // ignore — treat as unauthenticated
  }
  next();
};

// Grant access to specific roles: authorize("admin")
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role '${req.user.role}' is not authorized for this action`,
      });
    }
    next();
  };
};

// Allow owner of the resource OR privileged roles.
// Usage: allowSelfOr("admin") on PUT /api/players/:id
const allowSelfOr = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }
    const targetId = req.params.id || req.query.id;
    const isOwner = targetId && targetId.toString() === req.user._id.toString();
    if (isOwner || roles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({
      message: "Forbidden: you can only modify your own profile",
    });
  };
};

module.exports = { protect, optionalAuth, authorize, allowSelfOr };
