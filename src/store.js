// In-memory data store with some seed data
let tasks = [
  {
    id: "1",
    title: "Set up backend project",
    description: "Initialize Node.js project with Express",
    status: "completed",
    priority: "high",
    dueDate: "2026-07-16",
    createdAt: new Date("2026-07-16").toISOString(),
    updatedAt: new Date("2026-07-16").toISOString(),
  },
  {
    id: "2",
    title: "Build CRUD API",
    description: "Implement full REST API with in-memory storage",
    status: "in-progress",
    priority: "high",
    dueDate: "2026-07-17",
    createdAt: new Date("2026-07-17").toISOString(),
    updatedAt: new Date("2026-07-17").toISOString(),
  },
];

let nextId = 3;

const getAll = () => tasks;

const getById = (id) => tasks.find((t) => t.id === id);

const create = ({ title, description, status, priority, dueDate }) => {
  const task = {
    id: String(nextId++),
    title,
    description: description || "",
    status: status || "pending",
    priority: priority || "medium",
    dueDate: dueDate || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  tasks.push(task);
  return task;
};

const update = (id, fields) => {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return null;
  tasks[index] = {
    ...tasks[index],
    ...fields,
    id,
    updatedAt: new Date().toISOString(),
  };
  return tasks[index];
};

const remove = (id) => {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return false;
  tasks.splice(index, 1);
  return true;
};

module.exports = { getAll, getById, create, update, remove };
