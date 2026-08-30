# NeuroFive Backend — Week 3 --task 5

## Validation, Error Handling & Consistent API Responses

Built on top of the Week 2 JWT authentication system. This week's focus: making the API bulletproof — no crashes on bad input, no leaked stack traces, and a consistent response shape on every endpoint.

---

## Setup

```bash
npm install
cp .env.example .env   # fill in your JWT_SECRET
npm run dev
```

---

## Response Shape

Every endpoint — success or failure — returns this exact structure:

```json
{
  "success": true | false,
  "message": "Human-readable status",
  "data": { ... } | null,
  "error": [ ... ] | null
}
```

---

## Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/` | ❌ | Health check |
| POST | `/api/auth/signup` | ❌ | Register a new user |
| POST | `/api/auth/login` | ❌ | Login, receive JWT |
| GET | `/api/auth/me` | ✅ Bearer token | Get current user |

---

## Bad Request Examples

### 1. Empty body
**Request:** `POST /api/auth/signup` with body `{}`

```json
// 400 Bad Request
{
  "success": false,
  "message": "Request body cannot be empty",
  "data": null,
  "error": null
}
```

---

### 2. Missing required field
**Request:** `POST /api/auth/signup` — `email` field omitted

```json
// Request body
{ "username": "murk", "password": "secret123" }

// 422 Unprocessable Entity
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "error": [
    { "field": "email", "message": "Email is required" }
  ]
}
```

---

### 3. Invalid email format
**Request:** `POST /api/auth/signup`

```json
// Request body
{ "username": "murk", "email": "not-an-email", "password": "secret123" }

// 422 Unprocessable Entity
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "error": [
    { "field": "email", "message": "Please provide a valid email address" }
  ]
}
```

---

### 4. Password too short
**Request:** `POST /api/auth/signup`

```json
// Request body
{ "username": "murk", "email": "murk@test.com", "password": "hi" }

// 422 Unprocessable Entity
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "error": [
    { "field": "password", "message": "Password must be at least 8 characters long" }
  ]
}
```

---

### 5. Malformed JSON
**Request:** `POST /api/auth/login` with raw body `{ email: "murk@test.com"` (invalid JSON)

```json
// 400 Bad Request
{
  "success": false,
  "message": "Malformed JSON in request body",
  "data": null,
  "error": null
}
```

---

### 6. Duplicate email
**Request:** `POST /api/auth/signup` with an already-registered email

```json
// 409 Conflict
{
  "success": false,
  "message": "An account with this email already exists",
  "data": null,
  "error": null
}
```

---

### 7. Missing / tampered token on protected route
**Request:** `GET /api/auth/me` — no Authorization header

```json
// 401 Unauthorized
{
  "success": false,
  "message": "Authorization token missing or malformed",
  "data": null,
  "error": null
}
```

**Request:** `GET /api/auth/me` — token manually altered

```json
// 401 Unauthorized
{
  "success": false,
  "message": "Invalid or tampered token",
  "data": null,
  "error": null
}
```

---

### 8. Unknown route
**Request:** `GET /api/doesnotexist`

```json
// 404 Not Found
{
  "success": false,
  "message": "Route GET /api/doesnotexist not found",
  "data": null,
  "error": null
}
```

---

## Architecture

```
src/
├── app.js                    # Express setup, routes, 404, error handler
├── server.js                 # Entry point
├── config/
│   └── db.js                 # In-memory user store (simulates DB)
├── controllers/
│   └── authController.js     # signup, login, getMe logic
├── middleware/
│   ├── auth.js               # JWT protect middleware
│   ├── errorHandler.js       # AppError class + global error handler
│   └── validate.js           # Joi validation middleware factory
├── routes/
│   └── auth.js               # Route definitions
├── utils/
│   └── response.js           # sendSuccess / sendError helpers
└── validators/
    └── authValidators.js     # Joi schemas for signup & login
```

## Key Design Decisions

- **Centralized error handler** registered last in `app.js` — no try/catch needed in every controller, just `next(err)`
- **`AppError` class** distinguishes known errors (4xx) from unexpected crashes (5xx)
- **`stripUnknown: true`** in Joi silently drops extra fields so clients can't inject unexpected data
- **`abortEarly: false`** returns all validation errors at once instead of one at a time
- Stack traces are logged server-side only — clients never see them
