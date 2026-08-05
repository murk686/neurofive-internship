# NeuroFive Backend — Week 3 Task 6
## Relationships, Filtering & Pagination

Extends the Week 3 Task 5 auth system with a full **Posts → Comments** one-to-many relationship, plus filtering, sorting, and pagination across all list endpoints.

---

## Setup

```bash
npm install
cp .env.example .env   # set your JWT_SECRET
npm run dev
```

Pre-seeded with **40 posts** and **40 comments** across 3 users ready to test.

---

## Data Model

```
User (1) ──→ (many) Posts
Post (1) ──→ (many) Comments
```

---

## Endpoints

### Auth
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/signup` | ❌ | Register |
| POST | `/api/auth/login` | ❌ | Login, get JWT |
| GET | `/api/auth/me` | ✅ | Current user |

### Posts
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/posts` | ❌ | List all posts (filter/sort/paginate) |
| GET | `/api/posts/:id` | ❌ | Get single post |
| POST | `/api/posts` | ✅ | Create post |
| PATCH | `/api/posts/:id` | ✅ | Update own post |
| DELETE | `/api/posts/:id` | ✅ | Delete own post |

### Comments (Nested)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/posts/:id/comments` | ❌ | Get comments for a post |
| POST | `/api/posts/:id/comments` | ✅ | Add a comment |
| DELETE | `/api/posts/:postId/comments/:commentId` | ✅ | Delete own comment |

---

## Filtering, Sorting & Pagination

### Posts — `GET /api/posts`

| Query Param | Values | Example |
|-------------|--------|---------|
| `status` | `published`, `draft` | `?status=published` |
| `category` | `Technology`, `Science`, `Health`, `Business`, `Travel` | `?category=Technology` |
| `authorId` | user id | `?authorId=u1` |
| `search` | any string | `?search=node` |
| `sortBy` | `createdAt`, `updatedAt`, `title`, `views` | `?sortBy=views` |
| `order` | `asc`, `desc` | `?order=desc` |
| `page` | number | `?page=2` |
| `limit` | number (max 100) | `?limit=5` |

**Example:** `GET /api/posts?status=published&category=Technology&sortBy=views&order=desc&page=1&limit=5`

### Comments — `GET /api/posts/:id/comments`

| Query Param | Values | Example |
|-------------|--------|---------|
| `authorId` | user id | `?authorId=u2` |
| `order` | `asc`, `desc` | `?order=asc` |
| `page` | number | `?page=1` |
| `limit` | number | `?limit=3` |

---

## Response Shape

All responses follow:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "posts": [...],
    "pagination": {
      "total": 40,
      "page": 1,
      "limit": 5,
      "totalPages": 8,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "error": null
}
```

---

## Video Demo — Requests in Order

```
# 1. Health check
GET http://localhost:3000

# 2. All posts (page 1)
GET http://localhost:3000/api/posts?page=1&limit=5

# 3. Filter by status
GET http://localhost:3000/api/posts?status=published&limit=5

# 4. Filter by category
GET http://localhost:3000/api/posts?category=Technology&limit=5

# 5. Sort by views descending
GET http://localhost:3000/api/posts?sortBy=views&order=desc&limit=5

# 6. Search
GET http://localhost:3000/api/posts?search=node&limit=5

# 7. Combine filters + sort + pagination
GET http://localhost:3000/api/posts?status=published&category=Technology&sortBy=views&order=desc&page=1&limit=3

# 8. Next page
GET http://localhost:3000/api/posts?status=published&category=Technology&sortBy=views&order=desc&page=2&limit=3

# 9. Get single post
GET http://localhost:3000/api/posts/p1

# 10. Get comments for a post
GET http://localhost:3000/api/posts/p1/comments?page=1&limit=3

# 11. Login to get token
POST http://localhost:3000/api/auth/signup
{ "username": "murk", "email": "murk@test.com", "password": "secret123" }

# 12. Create a post (needs Bearer token)
POST http://localhost:3000/api/posts
{ "title": "My New Post", "body": "This is the body of my new post.", "category": "Technology", "status": "published" }

# 13. Add a comment (needs Bearer token)
POST http://localhost:3000/api/posts/p1/comments
{ "body": "Great post!" }
```
