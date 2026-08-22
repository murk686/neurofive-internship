# NeuroFive Backend — Week 5 Task 12
## Production Deployment, Logging & Monitoring

Live URL: **https://neurofive-backend.onrender.com**
Health Check: **https://neurofive-backend.onrender.com/health**

---

## Features

- ✅ Deployed to **Render** (free tier)
- ✅ Structured logging with **Winston** (console + file)
- ✅ HTTP request logging with **Morgan** → Winston
- ✅ `/health` endpoint for uptime monitoring
- ✅ **UptimeRobot** pinging `/health` every 5 minutes
- ✅ Graceful crash handling (uncaughtException, unhandledRejection, SIGTERM)
- ✅ Environment variables for all secrets
- ✅ Production-ready start script

---

## Local Setup

```bash
npm install
cp .env.example .env   # fill in JWT_SECRET
npm run dev
```

---

## Deploy to Render

1. Push this folder to GitHub as `task12/`
2. Go to **render.com** → New → Web Service
3. Connect your GitHub repo
4. Set Root Directory: `task12`
5. Build Command: `npm install`
6. Start Command: `npm start`
7. Add environment variables:
   - `JWT_SECRET` = any long random string
   - `JWT_EXPIRES_IN` = 7d
   - `NODE_ENV` = production
8. Click **Deploy**

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port (auto-set by Render) | 3000 |
| `NODE_ENV` | Environment | production |
| `JWT_SECRET` | Secret for signing JWTs | random string |
| `JWT_EXPIRES_IN` | Token expiry | 7d |

---

## Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/` | ❌ | API info |
| GET | `/health` | ❌ | Health check for monitoring |
| POST | `/api/auth/signup` | ❌ | Register |
| POST | `/api/auth/login` | ❌ | Login |
| GET | `/api/auth/me` | ✅ Bearer | Current user |

---

## Logging

- **Console**: Colorized, human-readable (dev)
- **logs/error.log**: Errors only
- **logs/combined.log**: All log levels

Log levels: `error` → `warn` → `info` → `http` → `debug`

---

## UptimeRobot Setup

1. Go to **uptimerobot.com** → Create Monitor
2. Type: HTTP(S)
3. URL: `https://neurofive-backend.onrender.com/health`
4. Interval: 5 minutes
5. Get email alerts on downtime
