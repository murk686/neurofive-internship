# NeuroFive Backend — Week 5 Task 11
## Automated Testing & API Documentation

---

## Setup

```bash
npm install
cp .env.example .env   # set JWT_SECRET
npm run dev
```

API docs available at: **http://localhost:3000/api-docs**

---

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage
```

---

## Test Summary

### Unit Tests (`tests/unit.test.js`)
Tests core logic independently of Express or HTTP.

| Test Suite | Cases | What's Tested |
|------------|-------|---------------|
| `generateToken()` | 5 | Valid JWT, missing payload, missing secret, payload embedding, custom expiry |
| `verifyToken()` | 4 | Valid token, wrong secret, tampered token, missing token |
| `validateSignup()` | 7 | Valid data, missing fields, short username, special chars, bad email, short password, multiple errors |
| `validateLogin()` | 4 | Valid data, missing email, missing password, bad email format |

**Total unit tests: 20**

---

### Integration Tests (`tests/integration.test.js`)
Tests all endpoints via real HTTP using Supertest.

| Endpoint | Happy Path | Failure Cases |
|----------|-----------|---------------|
| `GET /` | ✅ 200 health check | ❌ 404 unknown route |
| `POST /api/auth/signup` | ✅ 201 created | ❌ 400 empty body, 422 missing fields, 422 bad email, 422 short password, 409 duplicate, 400 malformed JSON |
| `POST /api/auth/login` | ✅ 200 with token | ❌ 401 wrong password, 401 unknown email, 400 empty body, 422 bad email |
| `GET /api/auth/me` | ✅ 200 with profile | ❌ 401 no token, 401 tampered token, 401 malformed header |

**Total integration tests: 18**
**Total tests: 38**

---

## What IS Covered
- Token generation and verification logic
- All Joi validation rules for signup and login
- All 3 auth endpoints (happy path + failure cases)
- Empty body, malformed JSON, duplicate email edge cases
- JWT tampering and missing token scenarios
- 404 for unknown routes

## What is NOT Covered
- File upload endpoints (task7)
- RBAC/admin endpoints (task8)
- Pagination and filtering (task6)
- Database persistence (in-memory only — no DB connection tests)

---

## API Documentation

Interactive Swagger UI available at `http://localhost:3000/api-docs` when server is running.

### Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/` | ❌ | Health check |
| POST | `/api/auth/signup` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login, get JWT |
| GET | `/api/auth/me` | ✅ Bearer | Get current user |

### Response Shape
Every endpoint returns:
```json
{
  "success": true | false,
  "message": "Human-readable status",
  "data": { ... } | null,
  "error": [ ... ] | null
}
```
