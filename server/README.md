# Doctor Tracker — Backend API

Production-ready Express 5 + TypeScript + MongoDB REST API backend for the **Doctor Tracker** healthcare administration portal.

---

## 1. Technology Stack

- **Runtime & Language**: Node.js (v20+ / v24+), TypeScript 7.0+ (ESM / NodeNext, strict mode)
- **Web Framework**: Express 5.3
- **Database & ODM**: MongoDB with Mongoose 9.11
- **Request Validation**: Zod 4.6 (type-safe request parsing on `req.validated`)
- **Authentication & Security**:
  - HTTP-only JWT cookies (`jsonwebtoken` + `cookie-parser`)
  - Password hashing with `bcrypt` (cost factor 12)
  - Timing attack defense via static cost-12 dummy hash comparison
  - Strict 72-byte UTF-8 password limit
  - Brute-force protection (`express-rate-limit`)
  - HTTP security headers (`helmet`)
  - Origin-restricted CORS with credentials
- **Automated Testing**: Vitest 5.1 with Supertest and V8 code coverage

---

## 2. Architecture & Design Principles

```
server/
├── src/
│   ├── config/          # Central configuration & startup secret validation
│   ├── controllers/     # Request orchestrators (Auth, Doctor, Patient, Dashboard)
│   ├── middlewares/     # Error handler, Auth guard, Rate limiter, Zod validator
│   ├── models/          # Mongoose schemas (Admin, Doctor, Patient)
│   ├── routes/          # Express route definitions mounted on /api/v1
│   ├── scripts/         # Out-of-band admin seed script (seed:admin)
│   ├── utils/           # Centralized ApiResponse, ApiError, asyncHandler, token, password
│   ├── validators/      # Zod validation schemas
│   ├── app.ts           # Express application configuration
│   └── server.ts        # Database connection & HTTP listener
├── tests/               # Persistent integration test suite
│   ├── helpers/         # Test database lifecycle & fixtures
│   ├── auth.test.ts     # Authentication & rate limiting tests
│   ├── doctor.test.ts   # Doctor CRUD, search & pagination tests
│   ├── patient.test.ts  # Patient CRUD, integrity & search tests
│   └── dashboard.test.ts# Dashboard overview, trends & analytics tests
├── docs/                # OpenAPI 3.1 specification (openapi.yaml)
└── vitest.config.ts     # Vitest configuration
```

### Key Architectural Decisions

1. **Why JWT is delivered exclusively via HTTP-only Cookies**:
   - Storing JWTs in browser `localStorage` or `sessionStorage` exposes tokens to Cross-Site Scripting (XSS) extraction.
   - Using an `HttpOnly`, `SameSite=Lax` (or `SameSite=None; Secure` for cross-site) cookie prevents client-side JavaScript access while ensuring the browser automatically submits authentication credentials.
   - The server **never** returns access tokens in JSON payloads.
2. **Guarded Doctor Deletion (Referential Integrity)**:
   - Patients maintain a mandatory reference (`assignedDoctorId`) to their attending physician.
   - Cascade-deleting patients when a doctor is removed would cause irreversible clinical data loss.
   - Orphaned references would corrupt auditability.
   - Therefore, deleting a Doctor with assigned patients is strictly rejected with **HTTP 409 Conflict**. The administrator must reassign or remove patients before deleting a doctor.

---

## 3. Getting Started

### Prerequisites

- Node.js `>= 20.0.0`
- pnpm `>= 9.0.0`
- MongoDB `>= 6.0` running locally or accessible via URI

### Installation

```bash
cd server
pnpm install
```

### Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure your environment variables:

| Variable | Description | Example |
|---|---|---|
| `PORT` | HTTP port | `5000` |
| `NODE_ENV` | Environment | `development` / `production` |
| `CLIENT_URL` | Allowed frontend origin for CORS | `http://localhost:3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/doctor_tracker` |
| `JWT_SECRET` | Secret key (min 32 characters) | `openssl rand -base64 32` |
| `JWT_EXPIRES_IN` | Token lifespan | `1h` |
| `ADMIN_NAME` | Initial administrator name | `System Administrator` |
| `ADMIN_EMAIL` | Initial administrator email | `admin@doctortracker.com` |
| `ADMIN_PASSWORD` | Initial administrator password | `"AdminPassword#2026"` |

> **Security Note**: Never commit `.env` or production credentials. In production (`NODE_ENV=production`), application startup will fail immediately if `JWT_SECRET` is missing, under 32 characters, or contains insecure placeholders like `"secret"` or `"changeme"`.

### Database Seeding (Admin Provisioning)

Public admin registration is disabled. Create the initial administrator out-of-band:

```bash
pnpm seed:admin
```
*(Idempotent: exits cleanly if the administrator already exists).*

---

## 4. Running the Application

### Development Mode (with hot-reload)

```bash
pnpm dev
```

### Type Checking & Production Build

```bash
# Typecheck TypeScript codebase
pnpm typecheck

# Compile TypeScript to dist/
pnpm build

# Run compiled production server
pnpm start
```

---

## 5. Automated Regression Testing

The backend includes a comprehensive, isolated integration test suite covering Authentication, Doctor CRUD, Patient CRUD, and Dashboard Analytics.

```bash
# Run all tests once
pnpm test

# Run tests with code coverage report
pnpm test:coverage

# Run tests in watch mode during development
pnpm test:watch
```

*Note: Tests connect to an isolated database (`doctor_tracker_vitest`) and do not touch development or production data.*

---

## 6. API Overview

All routes are mounted under the `/api/v1` prefix.

| Module | Method | Endpoint | Description | Auth Required |
|---|---|---|---|:---:|
| **Health** | `GET` | `/api/v1/health` | Uptime & health check | No |
| **Auth** | `POST` | `/api/v1/auth/login` | Administrator login (sets cookie) | No |
| **Auth** | `GET` | `/api/v1/auth/me` | Current admin profile | **Yes** |
| **Auth** | `POST` | `/api/v1/auth/logout` | Clears auth cookie | **Yes** |
| **Doctors** | `POST` | `/api/v1/doctors` | Create doctor | **Yes** |
| **Doctors** | `GET` | `/api/v1/doctors` | List doctors (search, date filter, pagination) | **Yes** |
| **Doctors** | `GET` | `/api/v1/doctors/:id` | Get single doctor by ID | **Yes** |
| **Doctors** | `PATCH` | `/api/v1/doctors/:id` | Partial update doctor | **Yes** |
| **Doctors** | `DELETE` | `/api/v1/doctors/:id` | Delete doctor (guarded against assigned patients) | **Yes** |
| **Patients** | `POST` | `/api/v1/patients` | Create patient (validates doctor existence) | **Yes** |
| **Patients** | `GET` | `/api/v1/patients` | List patients (search, condition, date, pagination) | **Yes** |
| **Patients** | `GET` | `/api/v1/patients/:id` | Get single patient by ID | **Yes** |
| **Patients** | `PATCH` | `/api/v1/patients/:id` | Partial update patient | **Yes** |
| **Patients** | `DELETE` | `/api/v1/patients/:id` | Delete patient | **Yes** |
| **Dashboard** | `GET` | `/api/v1/dashboard/overview` | Summary stats, doctor load & insights | **Yes** |
| **Dashboard** | `GET` | `/api/v1/dashboard/patient-trends` | Continuous time-series registration trend | **Yes** |
| **Dashboard** | `GET` | `/api/v1/dashboard/patients-by-doctor` | Patient count per doctor (sorted desc) | **Yes** |
| **Dashboard** | `GET` | `/api/v1/dashboard/conditions` | Patient condition breakdown (sorted desc) | **Yes** |

Detailed OpenAPI 3.1 documentation is available in [`docs/openapi.yaml`](./docs/openapi.yaml).

---

## 7. Response Envelopes & Error Handling

All API endpoints strictly follow the standard JSON response envelopes:

### Success Envelope
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

### Error Envelope
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "body.email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

### HTTP Status Codes
- `200 OK`: Successful retrieval, update, or deletion.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Invalid input or non-existent referenced doctor.
- `401 Unauthorized`: Missing, invalid, or expired authentication token.
- `404 Not Found`: Resource not found.
- `409 Conflict`: Unique constraint violation or doctor has assigned patients.
- `422 Unprocessable Entity`: Zod input validation failure.
- `429 Too Many Requests`: Brute-force rate limit reached.
- `500 Internal Server Error`: Server error (stack traces strictly suppressed in production).

