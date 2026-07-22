/**
 * server.js — Express application entry point
 *
 * Wires together middleware, routes, and starts the HTTP server.
 */

require("dotenv").config();

const express = require("express");
const app = express();

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------

// Parse incoming JSON bodies — required for req.body to work
app.use(express.json());

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// Public routes — no token needed
app.use("/api/auth", require("./routes/auth"));

// Protected routes — the authenticate middleware runs inside this router
app.use("/api", require("./routes/protected"));

// Health check — useful for deployment environments
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ---------------------------------------------------------------------------
// 404 fallback
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: "NOT_FOUND",
    message: "This route does not exist.",
  });
});

// ---------------------------------------------------------------------------
// Global error handler
// Catches any error thrown by route handlers that wasn't handled locally.
// ---------------------------------------------------------------------------
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "SERVER_ERROR",
    message: "An unexpected error occurred.",
  });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Auth server running on http://localhost:${PORT}`);
  console.log("   POST /api/auth/signup   → Create account");
  console.log("   POST /api/auth/login    → Login & get token");
  console.log("   GET  /api/profile       → Protected: your profile");
  console.log("   GET  /api/dashboard     → Protected: dashboard\n");
});

module.exports = app; // export for testing
