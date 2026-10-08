const Match = require("../models/matchModel");
const Player = require("../models/playerModel");
const Availability = require("../models/availabilityModel");
const {
  sendNotification,
  buildMatchCreated,
  buildReminder,
  buildSquadXI,
  buildSquadReserve,
  buildResult,
  availabilityLink,
} = require("../services/notificationService");

const populateSquad = (query) =>
  query.populate("squad.playingXI", "name playerRole jerseyNumber phoneNumber city");

// POST /api/matches — admin, captain
// 1. save match 2. create pending availability for all active players 3. notify them
const createMatch = async (req, res) => {
  try {
    const {
      opponent,
      matchType,
      date,
      time,
      venue,
      reportingTime,
      matchFee,
      availabilityDeadline,
      notes,
    } = req.body;

    if (!opponent || !date || !time || !venue || !availabilityDeadline) {
      return res.status(400).json({
        message: "opponent, date, time, venue and availabilityDeadline are required",
      });
    }

    const match = await Match.create({
      opponent,
      matchType,
      date,
      time,
      venue,
      reportingTime,
      matchFee,
      availabilityDeadline,
      notes,
      status: "availability_open",
      createdBy: req.user._id,
    });

    const players = await Player.find({ isActive: { $ne: false } }).select("_id phoneNumber");
    const message = buildMatchCreated(match);
    let notified = 0;
    for (const p of players) {
      await Availability.create({ match: match._id, player: p._id, status: "pending" });
      await sendNotification({
        recipientId: p._id,
        recipientPhone: p.phoneNumber,
        matchId: match._id,
        type: "match_created",
        title: `New match: ROYAL KINGS vs ${match.opponent}`,
        message,
        link: availabilityLink(match._id),
      });
      notified += 1;
    }

    res.status(201).json({
      message: `Match created. ${notified} players notified.`,
      data: match,
      notified,
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

// GET /api/matches?filter=upcoming|past|all — any logged-in user
const getMatches = async (req, res) => {
  try {
    const filter = req.query.filter || "upcoming";
    const q = {};
    if (filter === "upcoming") {
      q.status = { $in: ["scheduled", "availability_open", "squad_announced"] };
    } else if (filter === "past") {
      q.status = { $in: ["completed", "cancelled"] };
    }
    const matches = await Match.find(q).sort({ date: 1 }).populate("createdBy", "name");
    res.status(200).json({ message: "Matches fetched", count: matches.length, data: matches });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/matches/:id — any logged-in user
const getMatch = async (req, res) => {
  try {
    const match = await populateSquad(
      Match.findById(req.params.id).populate("createdBy", "name"),
    )
      .populate("squad.reserves", "name playerRole jerseyNumber phoneNumber city")
      .populate("squad.captain", "name")
      .populate("squad.viceCaptain", "name")
      .populate("squad.wicketKeeper", "name");
    if (!match) return res.status(404).json({ message: "Match not found" });
    res.status(200).json({ message: "Match fetched", data: match });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/matches/:id — admin, captain (not after completion)
const updateMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: "Match not found" });
    if (["completed", "cancelled"].includes(match.status)) {
      return res.status(400).json({ message: "Completed/cancelled matches cannot be edited" });
    }
    const allowed = [
      "opponent", "matchType", "date", "time", "venue", "reportingTime",
      "matchFee", "availabilityDeadline", "notes", "status",
    ];
    for (const k of allowed) if (req.body[k] !== undefined) match[k] = req.body[k];
    await match.save();
    res.status(200).json({ message: "Match updated", data: match });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

// POST /api/matches/:id/cancel — admin, captain
const cancelMatch = async (req, res) => {
  try {
    const match = await Match.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled" },
      { new: true },
    );
    if (!match) return res.status(404).json({ message: "Match not found" });
    res.status(200).json({ message: "Match cancelled", data: match });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- availability ------------------------------------------------------------

// GET /api/matches/:id/availability — grouped dashboard (any logged-in user)
const getAvailability = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id).select("opponent date status");
    if (!match) return res.status(404).json({ message: "Match not found" });

    const records = await Availability.find({ match: match._id }).populate(
      "player",
      "name playerRole jerseyNumber phoneNumber city role isActive",
    );

    const groups = { available: [], maybe: [], not_available: [], pending: [] };
    for (const r of records) {
      if (!r.player || r.player.isActive === false) continue;
      groups[r.status].push({
        _id: r.player._id,
        name: r.player.name,
        playerRole: r.player.playerRole,
        jerseyNumber: r.player.jerseyNumber,
        phoneNumber: r.player.phoneNumber,
        city: r.player.city,
        respondedAt: r.respondedAt,
      });
    }
    const counts = {
      available: groups.available.length,
      maybe: groups.maybe.length,
      not_available: groups.not_available.length,
      pending: groups.pending.length,
      total: records.length,
    };
    res.status(200).json({
      message: "Availability fetched",
      data: { match, counts, groups },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/matches/:id/availability { status, playerId? }
// Players respond for themselves only; admin/captain may mark on behalf.
const respondAvailability = async (req, res) => {
  try {
    const { status, playerId } = req.body;
    if (!["available", "maybe", "not_available"].includes(status)) {
      return res.status(400).json({
        message: "status must be one of: available, maybe, not_available",
      });
    }
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: "Match not found" });
    if (["completed", "cancelled"].includes(match.status)) {
      return res.status(400).json({ message: "Match is over — availability closed" });
    }

    let targetId = req.user._id.toString();
    const privileged = ["admin", "captain"].includes(req.user.role);
    if (playerId) {
      if (!privileged && playerId.toString() !== targetId) {
        return res.status(403).json({ message: "You can only respond for yourself" });
      }
      targetId = playerId;
    }

    if (!privileged && new Date() > new Date(match.availabilityDeadline)) {
      return res.status(400).json({ message: "Availability deadline has passed" });
    }

    const record = await Availability.findOneAndUpdate(
      { match: match._id, player: targetId },
      { status, respondedAt: new Date() },
      { new: true },
    );
    if (!record) return res.status(404).json({ message: "No availability record for this player" });

    res.status(200).json({ message: `Marked as ${status}`, data: record });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/matches/:id/remind { final?: boolean } — admin, captain
// Notifies ONLY pending players. Returns WhatsApp deep links for manual forwarding.
const remindPending = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: "Match not found" });
    if (["completed", "cancelled"].includes(match.status)) {
      return res.status(400).json({ message: "Match is over — nothing to remind" });
    }

    const pending = await Availability.find({ match: match._id, status: "pending" }).populate(
      "player",
      "name phoneNumber isActive",
    );
    const targets = pending.filter((r) => r.player && r.player.isActive !== false);
    const message = buildReminder(match, req.body.final === true);

    const reminded = [];
    for (const r of targets) {
      const doc = await sendNotification({
        recipientId: r.player._id,
        recipientPhone: r.player.phoneNumber,
        matchId: match._id,
        type: "availability_reminder",
        title: `Reminder: ROYAL KINGS vs ${match.opponent}`,
        message,
        link: availabilityLink(match._id),
      });
      reminded.push({ playerId: r.player._id, name: r.player.name, whatsappLink: doc.whatsappLink });
    }

    match.lastReminderAt = new Date();
    await match.save();

    res.status(200).json({
      message: `${reminded.length} pending players reminded. Responders were never contacted.`,
      data: reminded,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- squad -------------------------------------------------------------------

const sameId = (a, b) => a.toString() === b.toString();

const validateSquad = async (matchId, { playingXI = [], reserves = [], captain, viceCaptain, wicketKeeper, force }) => {
  if (playingXI.length > 11) return "Playing XI cannot exceed 11 players";
  const all = [...playingXI, ...reserves];
  if (new Set(all.map(String)).size !== all.length) {
    return "A player cannot be selected twice (XI + reserves must be unique)";
  }
  for (const roleId of [captain, viceCaptain, wicketKeeper]) {
    if (roleId && !playingXI.some((id) => sameId(id, roleId))) {
      return "Captain, vice-captain and wicket-keeper must be in the Playing XI";
    }
  }
  if (!force) {
    const records = await Availability.find({ match: matchId });
    const ok = new Set(
      records.filter((r) => ["available", "maybe"].includes(r.status)).map((r) => r.player.toString()),
    );
    const offender = all.find((id) => !ok.has(id.toString()));
    if (offender) {
      return "Only Available/Maybe players are normally selectable (admin may pass force:true to override)";
    }
  }
  // every id must be an active player
  const count = await Player.countDocuments({ _id: { $in: all }, isActive: { $ne: false } });
  if (count !== all.length) return "One or more selected players are invalid or deactivated";
  return null;
};

// PUT /api/matches/:id/squad — admin, captain (draft; announce separately)
const selectSquad = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: "Match not found" });
    if (["completed", "cancelled"].includes(match.status)) {
      return res.status(400).json({ message: "Match is over — squad locked" });
    }
    const { playingXI = [], reserves = [], captain, viceCaptain, wicketKeeper } = req.body;
    if ((reserves || []).length > 5) {
      return res.status(400).json({ message: "Reserves cannot exceed 5 players" });
    }
    const force = req.body.force === true && req.user.role === "admin";
    const error = await validateSquad(match._id, { playingXI, reserves, captain, viceCaptain, wicketKeeper, force });
    if (error) return res.status(400).json({ message: error });

    match.squad = { playingXI, reserves, captain, viceCaptain, wicketKeeper };
    await match.save();
    const populated = await populateSquad(Match.findById(match._id));
    res.status(200).json({ message: `Squad drafted (${playingXI.length} XI + ${reserves.length} reserves)`, data: populated.squad });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/matches/:id/announce — admin, captain. Requires full XI. Notifies squad.
const announceSquad = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: "Match not found" });
    const { playingXI = [], reserves = [] } = match.squad || {};
    if (playingXI.length !== 11) {
      return res.status(400).json({ message: "Announce requires exactly 11 in the Playing XI" });
    }
    if (!match.squad.captain || !match.squad.wicketKeeper) {
      return res.status(400).json({ message: "Captain and wicket-keeper must be assigned before announcing" });
    }

    match.squad.announcedAt = new Date();
    match.squad.announcedBy = req.user._id;
    match.status = "squad_announced";
    await match.save();

    let xiCount = 0;
    for (const pid of playingXI) {
      const p = await Player.findById(pid).select("phoneNumber");
      await sendNotification({
        recipientId: pid,
        recipientPhone: p?.phoneNumber,
        matchId: match._id,
        type: "squad_selected",
        title: `Selected! ROYAL KINGS vs ${match.opponent}`,
        message: buildSquadXI(match),
      });
      xiCount += 1;
    }
    let resCount = 0;
    for (let i = 0; i < reserves.length; i += 1) {
      const pid = reserves[i];
      const p = await Player.findById(pid).select("phoneNumber");
      await sendNotification({
        recipientId: pid,
        recipientPhone: p?.phoneNumber,
        matchId: match._id,
        type: "squad_reserve",
        title: `Reserve #${i + 1}: ROYAL KINGS vs ${match.opponent}`,
        message: buildSquadReserve(match, i + 1),
      });
      resCount += 1;
    }

    res.status(200).json({
      message: `Squad announced: ${xiCount} XI + ${resCount} reserves notified.`,
      data: match.squad,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- result --------------------------------------------------------------------

// PATCH /api/matches/:id/result — admin, captain (after announcement)
const recordResult = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: "Match not found" });
    if (match.status !== "squad_announced") {
      return res.status(400).json({ message: "Announce the squad before recording the result" });
    }
    const { ourScore, opponentScore, outcome, summary, manOfTheMatch } = req.body;
    if (outcome && !["win", "loss", "draw", "tie", "no_result"].includes(outcome)) {
      return res.status(400).json({ message: "Invalid outcome" });
    }
    match.result = {
      ourScore, opponentScore, outcome, summary, manOfTheMatch,
      recordedAt: new Date(), recordedBy: req.user._id,
    };
    match.status = "completed";
    await match.save();

    const players = await Player.find({ isActive: { $ne: false } }).select("_id phoneNumber");
    const message = buildResult(match);
    for (const p of players) {
      await sendNotification({
        recipientId: p._id,
        recipientPhone: p.phoneNumber,
        matchId: match._id,
        type: "match_result",
        title: `Result: ROYAL KINGS vs ${match.opponent}`,
        message,
      });
    }

    res.status(200).json({ message: "Result recorded. Team notified.", data: match.result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- stats / history ------------------------------------------------------------

// GET /api/matches/history?limit=20 — completed matches, newest first
const history = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const matches = await Match.find({ status: "completed" })
      .sort({ date: -1 })
      .limit(limit)
      .populate("squad.captain", "name")
      .populate("result.manOfTheMatch", "name");
    res.status(200).json({ message: "History fetched", count: matches.length, data: matches });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/matches/stats/team
const teamStats = async (req, res) => {
  try {
    const done = await Match.find({ status: "completed" });
    const byOutcome = {};
    for (const m of done) byOutcome[m.result?.outcome || "unknown"] = (byOutcome[m.result?.outcome || "unknown"] || 0) + 1;
    const upcoming = await Match.countDocuments({
      status: { $in: ["scheduled", "availability_open", "squad_announced"] },
    });
    const availAgg = await Availability.aggregate([
      { $group: { _id: "$status", n: { $sum: 1 } } },
    ]);
    res.status(200).json({
      message: "Team stats",
      data: {
        played: done.length,
        wins: byOutcome.win || 0,
        losses: byOutcome.loss || 0,
        draws: (byOutcome.draw || 0) + (byOutcome.tie || 0),
        noResult: byOutcome.no_result || 0,
        upcoming,
        availabilityTotals: availAgg,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/matches/stats/players/:playerId — self, admin or captain
const playerStats = async (req, res) => {
  try {
    const { playerId } = req.params;
    const privileged = ["admin", "captain"].includes(req.user.role);
    if (!privileged && playerId !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only view your own statistics" });
    }
    const announced = await Match.find({
      status: { $in: ["squad_announced", "completed"] },
      "squad.playingXI": playerId,
    }).select("result opponent date");
    const completed = announced.filter((m) => m.result);
    const motm = await Match.countDocuments({ "result.manOfTheMatch": playerId });
    const avail = await Availability.aggregate([
      { $match: { player: require("mongoose").Types.ObjectId.createFromHexString(playerId) } },
      { $group: { _id: "$status", n: { $sum: 1 } } },
    ]);
    const availMap = {};
    for (const a of avail) availMap[a._id] = a.n;
    const responded = (availMap.available || 0) + (availMap.maybe || 0) + (availMap.not_available || 0);
    const total = responded + (availMap.pending || 0);

    res.status(200).json({
      message: "Player stats",
      data: {
        appearances: announced.length,
        wins: completed.filter((m) => m.result.outcome === "win").length,
        manOfTheMatch: motm,
        availability: {
          ...availMap,
          responseRate: total ? Math.round((responded / total) * 100) : 0,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
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
};
