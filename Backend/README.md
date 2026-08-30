# Nebula Backend — Auth API

Node.js + Express.js + MongoDB authentication backend for Nebula Business Operations Hub.

## Prerequisites

- Node.js 18+
- MongoDB 6+ (local or Atlas)

## Setup

```bash
cd Backend
npm install

# Copy .env template and fill in your values
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secrets (use `openssl rand -hex 64` for secrets)

npm run dev
```

The API starts on `http://localhost:5000` (or the PORT in your .env).

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | HTTP port (default: 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens (use a long random string) |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens (must differ from access secret) |
| `JWT_ACCESS_EXPIRES_IN` | Access token expiry (default: `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry (default: `7d`) |
| `BCRYPT_ROUNDS` | bcrypt salt rounds (default: `12`) |
| `FRONTEND_ORIGIN` | Frontend URL for CORS (default: `http://localhost:5173`) |

---

## API Contract

Base URL: `http://localhost:5000/api/v1`

### POST `/auth/signup`

Creates an organization, super admin user, and optional pending invites — all in one atomic MongoDB transaction.

**Request Body:**
```json
{
  "fullName": "string (required, min 2 chars)",
  "email": "string (required, valid email)",
  "password": "string (required, min 8 chars, at least 1 letter + 1 number)",
  "organizationName": "string (required)",
  "companySize": "\"1-10\" | \"11-50\" | \"51-200\" | \"201-1000\" | \"1000+\"",
  "industry": "string (optional)",
  "primaryFocus": ["crm", "hrms", "recruitment", "expenses", "inventory", "analytics", "all"],
  "invites": [{ "email": "string", "role": "admin|manager|hr|recruiter|sales|finance|inventory_manager|employee" }]
}
```

**Response `201`:**
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "user": { "id": "string", "fullName": "string", "email": "string", "role": "super_admin" },
  "organization": { "id": "string", "name": "string", "primaryFocus": ["string"] },
  "invitesSent": 0
}
```

**Errors:** `400` validation, `409` email already exists, `500` server error.

---

### POST `/auth/login`

**Request Body:** `{ "email": "string", "password": "string" }`

**Response `200`:** Same shape as signup (minus `invitesSent`).

**Errors:** `400` missing fields, `401` invalid credentials, `403` account disabled.

---

### POST `/auth/refresh`

Refresh token rotation — verifies token against stored hash, rejects replayed tokens, issues a new pair.

**Request Body:** `{ "refreshToken": "string" }`

**Response `200`:** Same shape as login.

**Errors:** `400` missing token, `401` expired/invalid/mismatched token.

---

### POST `/auth/logout`

Requires `Authorization: Bearer <accessToken>`. Clears the stored refresh token hash.

**Response `200`:** `{ "message": "Logged out successfully." }`

---

### GET `/users/me`

Requires `Authorization: Bearer <accessToken>`.

**Response `200`:**
```json
{
  "user": { "id": "string", "fullName": "string", "email": "string", "role": "string" },
  "organization": { "id": "string", "name": "string", "primaryFocus": ["string"] }
}
```

---

## Security Notes

- Passwords are hashed with bcrypt (12+ rounds).
- Refresh tokens are stored as bcrypt hashes — the raw token is never persisted.
- On token mismatch during refresh (possible theft), the entire session is invalidated.
- Rate limiting: 5 req/15 min on `/auth/login` and `/auth/signup`, 10 req/15 min on `/auth/refresh`.
- CORS is locked to `FRONTEND_ORIGIN`.
- All requests are logged with Morgan in development.
- Audit logs are written for all auth actions (signup, login, logout).

## Project Structure

```
Backend/src/
├── config/       db.js, roles.js
├── models/       Organization.js, User.js, Invite.js, AuditLog.js
├── middleware/   auth.js (requireAuth), rbac.js (requireRole), tenant.js (scopedFilter)
├── utils/        password.js, jwt.js, audit.js
├── controllers/  authController.js, userController.js
├── routes/       authRoutes.js, userRoutes.js
├── app.js        Express setup
└── server.js     Entry point
```
