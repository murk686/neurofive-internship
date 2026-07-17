# Task Manager CRUD API

> Week 1 · Task 2 — Build a CRUD API (In-Memory)  
> Neurofive Solutions Backend Development Internship — July 2026

A full REST API for managing tasks, with in-memory storage, request logging, input validation, and proper HTTP status codes.

---

## 🚀 Live Deployment

**Base URL:** `https://neurofive-task2-production.up.railway.app`

---

## 📁 Project Structure

```
neurofive-task2/
├── src/
│   ├── app.js          # Express app & routes
│   ├── tasks.js        # CRUD route handlers
│   └── store.js        # In-memory data store
├── middleware/
│   └── logger.js       # Request logger (method + path + response time)
├── postman_collection.json
├── server.js
├── package.json
├── .gitignore
└── README.md
```

---

## ⚙️ Setup & Run Locally

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

---

## 📡 API Endpoints

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

---

## 🛠 Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js 4.x
- **Storage:** In-memory (array)
- **Hosting:** Railway

---

## 👤 Author

**Murk Channa** — Backend Development Intern @ Neurofive Solutions  
[GitHub](https://github.com/murk686) · [Portfolio](https://murk-portfolio.netlify.app)
