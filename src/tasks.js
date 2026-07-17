const express = require("express");
const router = express.Router();
const store = require("./store");

// Validation helper
const validate = (body, requireAll = false) => {
  const errors = [];
  const validStatuses = ["pending", "in-progress", "completed"];
  const validPriorities = ["low", "medium", "high"];

  if (requireAll && !body.title) errors.push("title is required");
  if (body.title !== undefined && body.title.trim() === "")
    errors.push("title cannot be empty");
  if (body.status !== undefined && !validStatuses.includes(body.status))
    errors.push(`status must be one of: ${validStatuses.join(", ")}`);
  if (body.priority !== undefined && !validPriorities.includes(body.priority))
    errors.push(`priority must be one of: ${validPriorities.join(", ")}`);

  return errors;
};

// GET /tasks — list all tasks (with optional ?status= filter)
router.get("/", (req, res) => {
  let tasks = store.getAll();
  if (req.query.status) {
    tasks = tasks.filter((t) => t.status === req.query.status);
  }
  res.status(200).json({
    count: tasks.length,
    tasks,
  });
});

// GET /tasks/:id — get single task
router.get("/:id", (req, res) => {
  const task = store.getById(req.params.id);
  if (!task) {
    return res.status(404).json({ error: `Task with id ${req.params.id} not found` });
  }
  res.status(200).json(task);
});

// POST /tasks — create a task
router.post("/", (req, res) => {
  const errors = validate(req.body, true);
  if (errors.length > 0) {
    return res.status(400).json({ error: "Validation failed", details: errors });
  }

  const task = store.create(req.body);
  res.status(201).json(task);
});

// PUT /tasks/:id — full update
router.put("/:id", (req, res) => {
  const existing = store.getById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: `Task with id ${req.params.id} not found` });
  }

  const errors = validate(req.body, true);
  if (errors.length > 0) {
    return res.status(400).json({ error: "Validation failed", details: errors });
  }

  const updated = store.update(req.params.id, req.body);
  res.status(200).json(updated);
});

// PATCH /tasks/:id — partial update
router.patch("/:id", (req, res) => {
  const existing = store.getById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: `Task with id ${req.params.id} not found` });
  }

  const errors = validate(req.body, false);
  if (errors.length > 0) {
    return res.status(400).json({ error: "Validation failed", details: errors });
  }

  const updated = store.update(req.params.id, req.body);
  res.status(200).json(updated);
});

// DELETE /tasks/:id — delete a task
router.delete("/:id", (req, res) => {
  const deleted = store.remove(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: `Task with id ${req.params.id} not found` });
  }
  res.status(200).json({ message: `Task ${req.params.id} deleted successfully` });
});

module.exports = router;
