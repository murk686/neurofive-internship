<<<<<<< HEAD
# Task Manager CRUD API

> Week 1 · Task 2 — Build a CRUD API (In-Memory)  
> Neurofive Solutions Backend Development Internship — July 2026

A full REST API for managing tasks, with in-memory storage, request logging, input validation, and proper HTTP status codes.
=======
# Neurofive Solutions Backend API

> Week 1 · Backend Development — Dev Environment, Git & Health Check API  
> Neurofive Solutions Backend Development Internship — Started 16 July 2026

A minimal but production-ready Express.js REST API skeleton demonstrating a professional Node.js project setup, version-controlled workflow, and live deployment pipeline.
>>>>>>> 64cdd1323d62b81fd98676bf77d0226b56fdd574

---

## 🚀 Live Deployment

<<<<<<< HEAD
**Base URL:** `https://neurofive-task2-production.up.railway.app`
=======
**Base URL:** `https://neurofive-backend.onrender.com`  
**Health Check:** `https://neurofive-backend.onrender.com/health`
>>>>>>> 64cdd1323d62b81fd98676bf77d0226b56fdd574

---

## 📁 Project Structure

```
<<<<<<< HEAD
neurofive-task2/
├── src/
│   ├── app.js          # Express app & routes
│   ├── tasks.js        # CRUD route handlers
│   └── store.js        # In-memory data store
├── middleware/
│   └── logger.js       # Request logger (method + path + response time)
├── postman_collection.json
├── server.js
=======
neurofive-backend/
├── src/
│   └── app.js          # Express app (routes, middleware)
├── tests/
│   └── health.test.js  # Manual integration test
├── server.js           # Server entry point
├── render.yaml         # Render deployment config
>>>>>>> 64cdd1323d62b81fd98676bf77d0226b56fdd574
├── package.json
├── .gitignore
└── README.md
```

---

## ⚙️ Setup & Run Locally

<<<<<<< HEAD
```bash
npm install
npm run dev     # development with hot reload
npm start       # production
```

Server runs on **http://localhost:3000**

---

## 📋 Task Resource

Each task has these fields:

| Field | Type | Required | Values |
|---|---|---|---|
| `id` | string | auto | auto-generated |
| `title` | string | ✅ | any text |
| `description` | string | ❌ | any text |
| `status` | string | ❌ | `pending` \| `in-progress` \| `completed` |
| `priority` | string | ❌ | `low` \| `medium` \| `high` |
| `dueDate` | string | ❌ | `YYYY-MM-DD` |
| `createdAt` | string | auto | ISO timestamp |
| `updatedAt` | string | auto | ISO timestamp |
=======
**Prerequisites:** Node.js v18+

```bash
# 1. Clone the repo
git clone https://github.com/murk686/neurofive-internship.git
cd neurofive-internship/week1-backend

# 2. Install dependencies
npm install

# 3. Start dev server (with hot reload)
npm run dev

# 4. Or start production server
npm start
```

Server runs on **http://localhost:3000** by default.
>>>>>>> 64cdd1323d62b81fd98676bf77d0226b56fdd574

---

## 📡 API Endpoints

<<<<<<< HEAD
### GET /tasks
List all tasks. Optional `?status=` filter.

```
GET /tasks
GET /tasks?status=pending
GET /tasks?status=in-progress
GET /tasks?status=completed
```
**Response: 200**
```json
{ "count": 2, "tasks": [...] }
```

---

### GET /tasks/:id
Get a single task by ID.

**Response: 200** — task object  
**Response: 404** — task not found

---

### POST /tasks
Create a new task. `title` is required.

```json
{
  "title": "Build CRUD API",
  "description": "In-memory storage with Express",
  "status": "in-progress",
  "priority": "high",
  "dueDate": "2026-07-17"
}
```
**Response: 201** — created task  
**Response: 400** — validation error

---

### PUT /tasks/:id
Full update — all fields required.

**Response: 200** — updated task  
**Response: 404** — not found  
**Response: 400** — validation error

---

### PATCH /tasks/:id
Partial update — only send fields to change.

```json
{ "status": "completed" }
```
**Response: 200** — updated task  
**Response: 404** — not found

---

### DELETE /tasks/:id
Delete a task by ID.

**Response: 200** — `{ "message": "Task X deleted successfully" }`  
**Response: 404** — not found

---

## 🧪 Testing with Postman

Import `postman_collection.json` into Postman — all endpoints are pre-configured with example request bodies.
=======
### `GET /`
Returns API info.

**Response:**
```json
{
  "message": "Neurofive Solutions Backend API",
  "version": "1.0.0",
  "endpoints": { "health": "GET /health" }
}
```

---

### `GET /health`
Live health check — confirms the server is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-07-16T10:00:00.000Z",
  "uptime": 42.3,
  "environment": "production"
}
```

---

## 🧪 Running Tests

```bash
npm test
```

---

## 🚢 Deployment (Render)

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Render auto-detects `render.yaml` — click **Deploy**
5. Your live URL will be `https://<service-name>.onrender.com`
>>>>>>> 64cdd1323d62b81fd98676bf77d0226b56fdd574

---

## 🛠 Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js 4.x
<<<<<<< HEAD
- **Storage:** In-memory (array)
- **Hosting:** Railway
=======
- **Hosting:** Render (free tier)
- **Version Control:** Git + GitHub
>>>>>>> 64cdd1323d62b81fd98676bf77d0226b56fdd574

---

## 👤 Author

**Murk Channa** — Backend Development Intern @ Neurofive Solutions  
[GitHub](https://github.com/murk686) · [Portfolio](https://murk-portfolio.netlify.app)
