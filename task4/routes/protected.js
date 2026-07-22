/**
 * routes/protected.js — Routes that require authentication
 *
 * The `authenticate` middleware runs before every handler here.
 * If it passes, req.user is populated with the JWT payload.
 *
 * GET /api/profile    → return the logged-in user's profile
 * GET /api/dashboard  → return a personalized dashboard summary
 */

const express = require("express");
const authenticate = require("../middleware/auth");
const db = require("../db");

const router = express.Router();

// ---------------------------------------------------------------------------
// Protected Route 1: GET /api/profile
// Returns the full profile of the currently logged-in user.
// ---------------------------------------------------------------------------
router.get("/profile", authenticate, (req, res) => {
  // req.user was set by the authenticate middleware after verifying the JWT.
  // We fetch from the DB by ID to ensure we return fresh data.
  const user = db.findById(req.user.id);

  if (!user) {
    // Edge case: token valid but user was deleted from DB
    return res.status(404).json({
      success: false,
      error: "USER_NOT_FOUND",
      message: "User associated with this token no longer exists.",
    });
  }

  // Strip the password hash — never send it to the client
  const { passwordHash: _omit, ...safeUser } = user;

  return res.status(200).json({
    success: true,
    profile: safeUser,
  });
});

// ---------------------------------------------------------------------------
// Protected Route 2: GET /api/dashboard
// Returns a personalized summary for the logged-in user.
// In a real app this might aggregate stats, recent activity, etc.
// ---------------------------------------------------------------------------
router.get("/dashboard", authenticate, (req, res) => {
  const { id, name, email } = req.user; // from the JWT payload

  // Simulate dashboard data — in production this would query your DB
  const dashboardData = {
    welcome: `Welcome back, ${name}!`,
    userId: id,
    email,
    stats: {
      totalLogins: Math.floor(Math.random() * 50) + 1, // placeholder
      lastSeen: new Date().toISOString(),
      accountStatus: "active",
    },
    recentActivity: [
      { action: "Logged in", timestamp: new Date().toISOString() },
      {
        action: "Viewed profile",
        timestamp: new Date(Date.now() - 60000).toISOString(),
      },
    ],
  };

  return res.status(200).json({
    success: true,
    dashboard: dashboardData,
  });
});

module.exports = router;
