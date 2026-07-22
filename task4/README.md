# Task 4 — Authentication System (JWT)
### NeuroFive Internship | Week 2 · Backend Development (Node.js)

A production-ready authentication API built with Express, bcrypt, and JWTs. Covers signup, login, protected routes, and proper error handling for all token failure cases.

---

## Stack

| Tool | Purpose |
|------|---------|
| Express | HTTP server & routing |
| bcryptjs | Password hashing (never store plain text) |
| jsonwebtoken | Issue & verify JWTs |
| dotenv | Manage secrets via environment variables |

---

## Setup

```bash
npm install
cp .env.example .env
# Open .env and set a strong JWT_SECRET (min 32 random chars in production)
node server.js
```

---

## API Endpoints

### Public (no token needed)

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/signup` | Create account, returns JWT |
| POST | `/api/auth/login` | Verify credentials, returns JWT |

### Protected (Bearer token required)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/profile` | Returns logged-in user's profile |
| GET | `/api/dashboard` | Returns personalized dashboard data |

---

## Auth Flow

### Step 1 — Sign up

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/signup" -Method POST -ContentType "application/json" -Body '{"name":"Murk Channa","email":"murk@example.com","password":"securepass123"}'
```

Response:
```json
{
  "success": true,
  "message": "Account created successfully.",
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": { "id": 1, "name": "Murk Channa", "email": "murk@example.com" }
}
```

### Step 2 — Log in and save token

```powershell
$token = (Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"murk@example.com","password":"securepass123"}').token
```

### Step 3 — Access protected routes

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/profile" -Headers @{Authorization="Bearer $token"}

Invoke-RestMethod -Uri "http://localhost:3000/api/dashboard" -Headers @{Authorization="Bearer $token"}
```

### Step 4 — Verify routes are actually secured

```powershell
# No token → 401 MISSING_TOKEN
Invoke-RestMethod -Uri "http://localhost:3000/api/profile"

# Tampered token → 401 INVALID_TOKEN
Invoke-RestMethod -Uri "http://localhost:3000/api/profile" -Headers @{Authorization="Bearer faketoken123"}
```

---

## Error Reference

| Scenario | Status | Error Code |
|----------|--------|------------|
| No Authorization header | 401 | `MISSING_TOKEN` |
| Malformed / tampered token | 401 | `INVALID_TOKEN` |
| Token older than 1 hour | 401 | `TOKEN_EXPIRED` |
| Wrong password at login | 401 | `INVALID_CREDENTIALS` |
| Email already registered | 409 | `EMAIL_TAKEN` |
| Missing required fields | 400 | `MISSING_FIELDS` |
| Password under 8 chars | 400 | `WEAK_PASSWORD` |

---

## How JWTs Work (plain English)

1. On successful login, the server signs a **JWT** using a secret key stored in `.env`.
2. The token contains your `id`, `email`, `name` + an expiry timestamp — **not encrypted, just signed**.
3. On every protected request, the client sends the token in the `Authorization: Bearer <token>` header.
4. The server verifies the **signature** — if anyone tampered with the payload, verification fails instantly.
5. No database lookup needed to authenticate — the token is self-contained.

> ⚠️ JWT payloads are base64-encoded, not encrypted. Never put passwords or secrets inside a JWT payload.

---

## Password Hashing

Passwords are hashed with `bcrypt` at **10 salt rounds** before storage.  
`bcrypt.compare()` is used at login — the plain-text password is never stored or logged anywhere.

---

## File Structure

```
task4/
├── server.js               # Entry point, app wiring, error handlers
├── db.js                   # In-memory user store (swap for MongoDB/PostgreSQL)
├── middleware/
│   └── auth.js             # JWT verification middleware
├── routes/
│   ├── auth.js             # POST /signup, POST /login
│   └── protected.js        # GET /profile, GET /dashboard
├── .env                    # Your secrets (never commit this)
├── .env.example            # Template for other devs
└── README.md
```

---

## Test Results

| Test | Status | Response |
|------|--------|----------|
| Signup | ✅ 201 | Account created + JWT issued |
| Login | ✅ 200 | Fresh JWT returned |
| Profile with valid token | ✅ 200 | User profile data |
| Dashboard with valid token | ✅ 200 | Dashboard data |
| Profile with no token | ❌ 401 | `MISSING_TOKEN` |
| Profile with fake token | ❌ 401 | `INVALID_TOKEN` |

---

*NeuroFive Internship — Week 2, Task 4*