# Architecture Document — Event Booking API

## Overview

A production-ready RESTful backend for an event booking platform built with Node.js, Express, PostgreSQL, and Sequelize. The system allows users to browse events, make bookings, and manage their profiles, while admins can create and manage events.

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Runtime | Node.js + Express | Lightweight, fast, widely used in production |
| Database | PostgreSQL | Relational data fits booking/event relationships well |
| ORM | Sequelize | Migrations, associations, and model validation out of the box |
| Auth | JWT (jsonwebtoken) | Stateless, scalable, no session storage needed |
| Validation | Zod | Schema-first, TypeScript-friendly, great error messages |
| File Uploads | Multer (memory storage) | Simple integration; memory storage used for Vercel compatibility |
| Docs | Swagger UI (OpenAPI 3.0) | Industry standard, live interactive docs |
| Deployment | Vercel | Free tier, automatic deployments from GitHub |
| Testing | Jest + Supertest | Integration tests against real HTTP layer |

---

## Project Structure

```
task14-Capstone/
├── src/
│   ├── config/         # Database config (Sequelize-CLI compatible)
│   ├── middleware/     # Auth, error handling, rate limiting, file upload
│   ├── models/         # Sequelize models (User, Event, Booking)
│   ├── routes/         # Express routers (auth, events, bookings)
│   ├── controllers/    # Route handlers and business logic
│   ├── utils/          # ApiError class, response helpers
│   └── app.js          # Express app setup
├── docs/
│   └── openapi.yaml    # Full OpenAPI 3.0 specification
├── tests/              # Integration tests (Jest + Supertest)
├── api/
│   └── index.js        # Vercel serverless entry point
└── future-work/        # Notes on planned improvements
```

---

## Core Design Decisions

### 1. Layered Architecture
Separated routes → controllers → models to keep concerns isolated. Routes handle HTTP, controllers handle business logic, models handle data — easy to test and extend.

### 2. JWT Authentication
Chose stateless JWT over sessions because:
- No server-side session storage needed
- Works well with serverless (Vercel) where instances don't share memory
- Scales horizontally without sticky sessions

### 3. Role-Based Access Control
Two roles: `user` and `admin`. Implemented via middleware that checks `req.user.role` after JWT verification. Admin-only endpoints: create/update/delete events. User endpoints: browse events, create/cancel bookings.

### 4. Zod for Validation
Chose Zod over Joi or express-validator because:
- Schema definitions are reusable across validation and type inference
- Better error messages out of the box
- Lightweight with no extra dependencies

### 5. Centralized Error Handling
All errors flow through a single `errorHandler` middleware via `ApiError` utility class. This ensures consistent JSON error responses across the entire API regardless of where the error originates.

### 6. Sequelize Migrations
Used Sequelize-CLI migrations instead of `sync({ force: true })` to:
- Keep database schema changes versioned and reversible
- Safely apply changes to production without data loss

---

## Database Schema

```
Users
├── id (UUID)
├── name
├── email (unique)
├── password (bcrypt hashed)
├── role (user | admin)
└── timestamps

Events
├── id (UUID)
├── title
├── description
├── location
├── date
├── capacity
├── price
├── coverImageUrl
├── createdBy (FK → Users)
└── timestamps

Bookings
├── id (UUID)
├── userId (FK → Users)
├── eventId (FK → Events)
├── status (confirmed | cancelled)
├── seats
└── timestamps
```

---

## Trade-offs & Limitations

| Decision | Trade-off |
|---|---|
| Vercel serverless deployment | No persistent filesystem — file uploads use memory storage instead of disk. For production, swap to S3/Cloudinary |
| JWT with no refresh tokens | Simpler implementation but tokens can't be invalidated before expiry. Fix: add a token blacklist or refresh token flow |
| Sequelize over raw SQL | Easier development but adds abstraction overhead. For high-performance queries, raw SQL or a query builder like Knex would be faster |
| Memory storage for uploads | Files are lost after the function completes. Acceptable for demo; requires S3 for real use |
| Single database | No read replicas. Fine for this scale; would need read/write splitting at higher traffic |

---

## Stretch Goals Implemented

- ✅ File uploads (Multer)
- ✅ Rate limiting (express-rate-limit)
- ✅ Pagination, filtering, and search on events
- ✅ CI/CD pipeline (GitHub Actions → Vercel auto-deploy)
- ✅ Docker support (.dockerignore, docker-ready structure)

---

## Future Improvements

- Swap file uploads to Cloudinary or AWS S3
- Add refresh token support
- Implement email notifications on booking confirmation (Nodemailer/SendGrid)
- Add Redis caching for event listings
- Background job for booking reminders