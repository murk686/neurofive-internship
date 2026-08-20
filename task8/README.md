# NeuroFive Backend — Week 4 Task 8
## Role-Based Access Control (RBAC)

Extends the auth system with three roles — **admin**, **moderator**, and **user** — each with different permissions enforced via middleware.

---

## Setup

```bash
npm install
cp .env.example .env   # set JWT_SECRET and ADMIN_SECRET
npm run dev
```

### Seeded accounts (password: `secret123`)
| Email | Role |
|-------|------|
| admin@test.com | admin |
| mod@test.com | moderator |
| user@test.com | user |

---

## Roles & Permissions

| Action | user | moderator | admin |
|--------|------|-----------|-------|
| Signup / Login | ✅ | ✅ | ✅ |
| View posts | ✅ | ✅ | ✅ |
| Create post | ✅ | ✅ | ✅ |
| Delete own post | ✅ | ✅ | ✅ |
| Delete any post | ❌ | ✅ | ✅ |
| List all users | ❌ | ❌ | ✅ |
| Change user role | ❌ | ❌ | ✅ |
| Deactivate user | ❌ | ❌ | ✅ |
| Delete user | ❌ | ❌ | ✅ |

---

## Endpoints

### Auth
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/signup` | ❌ | Register (add `adminSecret` for admin role) |
| POST | `/api/auth/login` | ❌ | Login |
| GET | `/api/auth/me` | ✅ | Current user + role |

### Posts
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/posts` | ❌ | List all posts |
| POST | `/api/posts` | ✅ any | Create post |
| DELETE | `/api/posts/:id` | ✅ owner / mod / admin | Delete post |

### Admin
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/admin/users` | ✅ admin | List all users |
| PATCH | `/api/admin/users/:id/role` | ✅ admin | Change role |
| PATCH | `/api/admin/users/:id/deactivate` | ✅ admin | Deactivate user |
| DELETE | `/api/admin/users/:id` | ✅ admin | Delete user |

---

## How 403 vs 401 Works

| Status | Meaning | When |
|--------|---------|------|
| 401 Unauthorized | Not logged in / bad token | No token, expired token, tampered token |
| 403 Forbidden | Logged in but wrong role | Valid token but insufficient permissions |

---

## Test Scenarios

### Scenario 1 — Admin can list all users, regular user cannot
```
Login as admin → GET /api/admin/users → 200 ✅
Login as user  → GET /api/admin/users → 403 ❌
```

### Scenario 2 — Admin can delete any post, user can only delete own
```
Login as admin → DELETE /api/posts/p2 (user's post) → 200 ✅
Login as user  → DELETE /api/posts/p1 (admin's post) → 403 ❌
Login as user  → DELETE /api/posts/p2 (own post)     → 200 ✅
```

### Scenario 3 — Admin can change roles, moderator cannot
```
Login as admin     → PATCH /api/admin/users/u3/role { "role": "moderator" } → 200 ✅
Login as moderator → PATCH /api/admin/users/u3/role { "role": "moderator" } → 403 ❌
```

### Scenario 4 — No token returns 401, wrong role returns 403
```
No token   → GET /api/admin/users → 401 ❌
User token → GET /api/admin/users → 403 ❌
Admin token → GET /api/admin/users → 200 ✅
```

---

## Video Demo Commands

```
# 1. Login as admin
POST /api/auth/login
{ "email": "admin@test.com", "password": "secret123" }

# 2. Admin lists all users → 200
GET /api/admin/users
Auth: Bearer <admin_token>

# 3. Admin changes user role → 200
PATCH /api/admin/users/u3/role
Auth: Bearer <admin_token>
{ "role": "moderator" }

# 4. Admin deletes another user's post → 200
DELETE /api/posts/p2
Auth: Bearer <admin_token>

# --- Now login as regular user ---

# 5. Login as user
POST /api/auth/login
{ "email": "user@test.com", "password": "secret123" }

# 6. User tries to list all users → 403 FORBIDDEN
GET /api/admin/users
Auth: Bearer <user_token>

# 7. User tries to change a role → 403 FORBIDDEN
PATCH /api/admin/users/u2/role
Auth: Bearer <user_token>
{ "role": "admin" }

# 8. User tries to delete admin's post → 403 FORBIDDEN
DELETE /api/posts/p1
Auth: Bearer <user_token>

# 9. No token at all → 401 UNAUTHORIZED
GET /api/admin/users
(no auth header)
```
