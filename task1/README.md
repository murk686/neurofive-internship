# Neurofive Solutions Backend API

> Week 1 · Backend Development — Dev Environment, Git & Health Check API  
> Neurofive Solutions Backend Development Internship — Started 16 July 2026

A minimal but production-ready Express.js REST API skeleton demonstrating a professional Node.js project setup, version-controlled workflow, and live deployment pipeline.

---

## 🚀 Live Deployment

**Base URL:** `https://neurofive-backend.onrender.com`  
**Health Check:** `https://neurofive-backend.onrender.com/health`

---

## 📁 Project Structure

```
neurofive-backend/
├── src/
│   └── app.js          # Express app (routes, middleware)
├── tests/
│   └── health.test.js  # Manual integration test
├── server.js           # Server entry point
├── render.yaml         # Render deployment config
├── package.json
├── .gitignore
└── README.md
```

---

## ⚙️ Setup & Run Locally

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

---

## 📡 API Endpoints

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

---

## 🛠 Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js 4.x
- **Hosting:** Render (free tier)
- **Version Control:** Git + GitHub

---

## 👤 Author

**Murk Channa** — Backend Development Intern @ Neurofive Solutions  
[GitHub](https://github.com/murk686) · [Portfolio](https://murk-portfolio.netlify.app)
