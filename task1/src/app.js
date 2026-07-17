const express = require("express");
const app = express();

app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// Root route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Neurofive Solutions Backend API",
    version: "1.0.0",
    endpoints: {
      health: "GET /health",
    },
  });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

module.exports = app;
