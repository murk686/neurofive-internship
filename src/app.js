const express = require("express");
<<<<<<< HEAD
const logger = require("../middleware/logger");
const tasksRouter = require("./tasks");

const app = express();

app.use(express.json());
app.use(logger);

// Routes
app.use("/tasks", tasksRouter);

// Root
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Neurofive Solutions — Task Manager API",
    version: "1.0.0",
    endpoints: {
      "GET    /tasks":         "List all tasks",
      "GET    /tasks?status=": "Filter by status (pending | in-progress | completed)",
      "GET    /tasks/:id":     "Get single task",
      "POST   /tasks":         "Create a task",
      "PUT    /tasks/:id":     "Full update a task",
      "PATCH  /tasks/:id":     "Partial update a task",
      "DELETE /tasks/:id":     "Delete a task",
    },
  });
});

// Health check
=======
const app = express();

app.use(express.json());

// Health check endpoint
>>>>>>> 64cdd1323d62b81fd98676bf77d0226b56fdd574
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

<<<<<<< HEAD
// 404
=======
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
>>>>>>> 64cdd1323d62b81fd98676bf77d0226b56fdd574
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

module.exports = app;
