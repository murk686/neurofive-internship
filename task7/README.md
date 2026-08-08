# NeuroFive Backend — Week 4 Task 7
## File Upload & Storage

Extends the auth system with file upload support using **Multer**. Users can upload profile pictures and documents, which are stored locally and served via a public URL linked back to the user's profile.

---

## Setup

```bash
npm install
cp .env.example .env   # set JWT_SECRET and BASE_URL
npm run dev
```

---

## Features

- ✅ Profile picture (avatar) upload — linked to user profile
- ✅ Document upload (PDF, DOC, DOCX) — linked to user account
- ✅ File type validation — rejects unsupported formats with clear errors
- ✅ File size validation — rejects files over 5MB
- ✅ Public URL generated for every uploaded file
- ✅ List all your uploaded files
- ✅ Delete your own files (disk + record)
- ✅ Graceful error messages — no crashes on bad uploads

---

## Endpoints

### Auth
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/signup` | ❌ | Register |
| POST | `/api/auth/login` | ❌ | Login, get JWT |
| GET | `/api/auth/me` | ✅ | Current user (includes avatar URL) |

### Upload
| Method | Route | Auth | Field Name | Description |
|--------|-------|------|------------|-------------|
| POST | `/api/upload/avatar` | ✅ | `avatar` | Upload profile picture |
| POST | `/api/upload/document` | ✅ | `document` | Upload any document/image |
| GET | `/api/upload/my-files` | ✅ | — | List your uploaded files |
| DELETE | `/api/upload/:fileId` | ✅ | — | Delete a file |
| GET | `/uploads/:filename` | ❌ | — | Retrieve/view any uploaded file |

---

## File Rules

| Rule | Value |
|------|-------|
| Max file size | 5MB |
| Allowed types (document) | JPEG, PNG, GIF, WEBP, PDF, DOC, DOCX |
| Allowed types (avatar) | JPEG, PNG, GIF, WEBP only |

---

## Response Shape

```json
{
  "success": true,
  "message": "Avatar uploaded successfully",
  "data": {
    "avatarUrl": "http://localhost:3000/uploads/uuid.jpg",
    "file": {
      "originalName": "photo.jpg",
      "size": 204800,
      "mimeType": "image/jpeg"
    }
  },
  "error": null
}
```

---

## Error Examples

### Wrong file type
```json
// 415 Unsupported Media Type
{
  "success": false,
  "message": "File type \"text/plain\" is not allowed. Accepted: JPEG, PNG, GIF, WEBP, PDF, DOC, DOCX",
  "data": null,
  "error": null
}
```

### File too large (over 5MB)
```json
// 400 Bad Request
{
  "success": false,
  "message": "File too large. Maximum allowed size is 5MB",
  "data": null,
  "error": null
}
```

### No file included
```json
// 400 Bad Request
{
  "success": false,
  "message": "No file uploaded. Include a file with field name \"avatar\"",
  "data": null,
  "error": null
}
```

### Wrong field name
```json
// 400 Bad Request
{
  "success": false,
  "message": "Unexpected field. Use \"avatar\" as the field name",
  "data": null,
  "error": null
}
```

---

## Video Demo — Requests in Order

```
1. Signup
POST http://localhost:3000/api/auth/signup
{ "username": "murk", "email": "murk@test.com", "password": "secret123" }

2. Login — copy the token
POST http://localhost:3000/api/auth/login
{ "email": "murk@test.com", "password": "secret123" }

3. Upload avatar (use form-data, field: avatar, attach an image)
POST http://localhost:3000/api/upload/avatar
Auth: Bearer <token>
Body: form-data → avatar = [your image file]

4. Check /me — avatar URL now appears in user profile
GET http://localhost:3000/api/auth/me
Auth: Bearer <token>

5. Open the avatarUrl in browser — file displays ✅

6. Upload a document
POST http://localhost:3000/api/upload/document
Auth: Bearer <token>
Body: form-data → document = [your PDF]

7. List your files
GET http://localhost:3000/api/upload/my-files
Auth: Bearer <token>

8. Open the file URL in browser — file displays/downloads ✅

9. Delete a file
DELETE http://localhost:3000/api/upload/<fileId>
Auth: Bearer <token>

--- Break it ---

10. Upload wrong type (e.g. a .txt file as avatar) → 415
11. No file in body → 400
12. Wrong field name → 400
```

---

## Architecture

```
src/
├── app.js
├── server.js
├── uploads/               ← stored files served at /uploads/
├── config/db.js
├── controllers/
│   ├── authController.js
│   └── uploadController.js
├── middleware/
│   ├── auth.js
│   ├── errorHandler.js
│   ├── upload.js          ← Multer config + file type/size validation
│   └── validate.js
├── routes/
│   ├── auth.js
│   └── upload.js
├── utils/response.js
└── validators/authValidators.js
```
