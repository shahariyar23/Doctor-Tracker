# Doctor Tracker — Phase 05: Admin Authentication Implementation Plan (Final Revised)

> **Role**: Senior Backend Engineer & Security Architect  
> **Status**: Final Planning Specification (Awaiting Approval — Zero application code modified, no packages installed, no database records created).  
> **Authority**: Official Project Specification PDF (§2.1 Authentication), Security Review Requirements, and active TypeScript backend architecture.

---

## 1. Existing Architecture & Dependency Audit

### 1.1 Existing Source & Module Audit

- **Admin Model** ([`src/models/admin.model.ts`](file:///home/shahariyar/Documents/Doctor_Tracker/server/src/models/admin.model.ts)):
  - Fields: `name` (required string, 2–100 chars), `email` (required, lowercase, trimmed, unique index, regex validation), `passwordHash` (required string, `select: false`).
  - Security serialization: `toJSON` transform explicitly strips `ret.passwordHash`.
  - Timestamps: Auto-managed `createdAt` and `updatedAt`.
  - **Audit Finding**: The `Admin` model is already lean, secure, and fully typed (`IAdmin`, `AdminDocument`, `AdminModel`). The model does **not** have an `isActive` status field; therefore, authentication relies strictly on finding the Admin document by `_id`. **No schema modification is required** to the `Admin` model itself.
- **Application & Server** ([`src/app.ts`](file:///home/shahariyar/Documents/Doctor_Tracker/server/src/app.ts), [`src/server.ts`](file:///home/shahariyar/Documents/Doctor_Tracker/server/src/server.ts)):
  - Express 5.3 with Helmet, CORS (origin configured to client URL, `credentials: true`), JSON & URL-encoded body parsers (limit 16kb), and centralized Morgan logger.
- **Routing & Validation** ([`src/routes/index.ts`](file:///home/shahariyar/Documents/Doctor_Tracker/server/src/routes/index.ts), [`src/middlewares/validate.middleware.ts`](file:///home/shahariyar/Documents/Doctor_Tracker/server/src/middlewares/validate.middleware.ts)):
  - Root router mounted on `/api/v1`.
  - Centralized Zod `validate({ body, query, params })` middleware populated on `req.validated`.
- **Response & Error Handling** ([`src/utils/api-response.ts`](file:///home/shahariyar/Documents/Doctor_Tracker/server/src/utils/api-response.ts), [`src/utils/api-error.ts`](file:///home/shahariyar/Documents/Doctor_Tracker/server/src/utils/api-error.ts), [`src/middlewares/error.middleware.ts`](file:///home/shahariyar/Documents/Doctor_Tracker/server/src/middlewares/error.middleware.ts)):
  - Standard success envelope: `{ success: true, message: string, data: T, meta: null }`.
  - Standard error envelope: `{ success: false, message: string, errors: unknown }`.

### 1.2 Installed Dependencies Check

- Currently installed in [`server/package.json`](file:///home/shahariyar/Documents/Doctor_Tracker/server/package.json):
  - `express`, `cors`, `helmet`, `dotenv`, `mongoose`, `zod`
  - devDependencies: `typescript`, `tsx`, `@types/node`, `@types/express`, `@types/cors`, `@types/morgan`, `morgan`
- **Required Dependencies to be Installed in Implementation Phase**:
  - `bcrypt` + `@types/bcrypt` (or `bcryptjs` + `@types/bcryptjs`)
  - `jsonwebtoken` + `@types/jsonwebtoken`
  - `cookie-parser` + `@types/cookie-parser`

---

## 2. Security Architecture Decisions & Token Delivery

### 2.1 Token Delivery Strategy: HTTP-Only Cookie Exclusive

- **No Token in Response Body**: The JWT access token is **never returned in the JSON response payload**.
- **Delivery Vector**: Delivered exclusively via an `httpOnly` cookie (`token`).
- **Response Content**: The login response returns **only the safe Admin profile** (`id`, `name`, `email`).
- **Client Configuration**:
  - The frontend Axios/fetch client must configure `withCredentials: true`.
  - CORS in `src/app.ts` remains strictly locked to the configured `CLIENT_URL` with `credentials: true`.

### 2.2 Deployment Topology & Cookie Configuration

| Topology                             | Frontend / Backend Origin                                                       | Cookie Attributes                                                                                                     | CSRF Defense Strategy                                                                                                                                                                               |
| :----------------------------------- | :------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Local Dev & Same-Site Production** | `localhost:3000` / `localhost:5000` (or `portal.domain.com` / `api.domain.com`) | `httpOnly: true`<br>`secure: NODE_ENV === "production"`<br>`sameSite: "lax"`<br>`path: "/"`<br>`maxAge: 3600000` (1h) | Browser Lax policy blocks cross-site POST/PUT/DELETE requests initiated by third parties.                                                                                                           |
| **Cross-Site Production**            | Independent third-party domains (e.g. `client.vercel.app` / `api.onrender.com`) | `httpOnly: true`<br>`secure: true`<br>`sameSite: "none"`<br>`path: "/"`<br>`maxAge: 3600000` (1h)                     | **Mandatory CSRF Protection**: Custom header verification (e.g. `X-Requested-With: XMLHttpRequest` or custom anti-CSRF header) for all state-changing mutations (`POST`, `PUT`, `PATCH`, `DELETE`). |

> **CSRF Threat Model Notice**:  
> HTTP-only cookies protect against client-side XSS token theft, but browsers automatically attach cookies to cross-origin requests. HTTP-only cookies **alone do NOT prevent CSRF**. Under same-site deployments, `SameSite=Lax` mitigates cross-site state changes. Under cross-site (`SameSite=None`), origin verification (`Origin` / `Referer` matching `CLIENT_URL`) and custom anti-CSRF header checks must be enforced on all non-GET endpoints.

### 2.3 JWT Lifecycle & Statelessness

- **Access Token Duration**: **1 Hour** (`JWT_EXPIRES_IN=1h` / `3600s`).
- **No Refresh Tokens / No Session Table**: To keep the system robust and avoid premature database write contention for an assessment admin portal, refresh tokens and session collections are omitted in this phase.
- **Logout Behavior**:
  - `POST /api/v1/auth/logout` clears the authentication cookie using the exact matching options (`path: "/"`, `httpOnly: true`, matching domain/sameSite).
  - Client discards local user state.
- **Accepted Security Trade-off**:
  - In a stateless JWT architecture without a database revocation blacklist, a stolen or previously copied JWT remains cryptographically valid until its 1-hour expiration timestamp. This is an explicitly accepted trade-off to avoid session database dependencies.

---

## 3. Password Security & Anti-Enumeration

### 3.1 Password Hashing & Strict 72-Byte UTF-8 Boundary

- **Algorithm**: `bcrypt` (cost factor: **`12`**).
- **Password Length & Bcrypt UTF-8 Byte Limit**:
  - Minimum length: **8 characters**.
  - Maximum limit: Bcrypt internally truncates passwords at exactly **72 bytes** (UTF-8 encoded). Multibyte Unicode characters can cause passwords under 72 characters to exceed 72 bytes.
  - Zod Validation Rule: Enforced via a custom refinement checking actual byte length:
    ```typescript
    z.string()
      .min(8, 'Password must be at least 8 characters long')
      .refine((val) => Buffer.byteLength(val, 'utf8') <= 72, 'Password cannot exceed 72 bytes');
    ```
  - This guarantees that inputs exceeding 72 bytes are rejected outright rather than silently truncated by bcrypt.
- **Zero Secret Logging**: Plaintext passwords and password hashes must never be logged to console, file, or APM.

### 3.2 Anti-Enumeration & Valid Constant-Time Dummy Verification

- **Generic Error Response**: If the email does not exist OR the password is incorrect, the server returns the exact same response:
  - HTTP `401 Unauthorized`
  - Body: `{ "success": false, "message": "Invalid email or password combination", "errors": null }`
- **Timing Attack Mitigation**:
  - When an admin email is not found in MongoDB, execute a constant-time bcrypt comparison against a **valid pre-generated bcrypt hash with cost factor 12**:
    ```typescript
    // Valid pre-generated bcrypt hash (cost factor 12) initialized once at application startup
    const DUMMY_HASH = '$2b$12$K14kLwR61R6cZqL54x08teN32vF69f6P4fF1QJv4d0k5f1jK87t9m';
    await bcrypt.compare(password, DUMMY_HASH);
    ```
  - **Rule**: Never generate a new bcrypt hash on every failed request (which would double CPU load). Use the verified static/pre-initialized hash.
  - This ensures that non-existent email requests consume ~250ms of CPU time, matching the response timing of existent accounts and preventing user enumeration.

### 3.3 Brute-Force Rate Limiting (Failed Attempts Only)

- **Policy**: Maximum **5 failed login attempts per 15 minutes per IP**.
- **Accurate Counting**:
  - Only responses with HTTP status codes indicating failed authentication (e.g. 401) increment the failure counter.
  - Successful logins (HTTP 200) do **not** increment the counter and reset any accumulated failure count for that IP.
- **Store Architecture & Limitations**:
  - Single-instance / evaluation: In-memory sliding window store.
  - _Limitation_: In-memory counters do not persist across server restarts and are per-instance in multi-process clusters.
  - _Production path_: Can be backed by Redis via `rate-limit-redis`.
- **Enumeration Prevention**: Rate limit responses return HTTP `429 Too Many Requests` with `{ "success": false, "message": "Too many failed login attempts. Please try again after 15 minutes.", "errors": null }` without disclosing account status.

---

## 4. JWT Structure, Verification & Secret Entropy

### 4.1 JWT Payload & Signing

- **Algorithm**: Explicitly enforce **`HS256`** in both `jwt.sign()` and `jwt.verify()`. Reject tokens with `alg: "none"` or unexpected algorithms.
- **Minimal, Secure Claims**:
  - `sub`: Admin `_id.toString()` (the primary key identifier).
  - `iss`: `"doctor-tracker-api"`.
  - `aud`: `"doctor-tracker-client"`.
  - `iat`: Timestamp issued.
  - `exp`: Timestamp expiration (1 hour from issue).
  - _Note_: Email is **not** stored in the JWT payload. The authentication middleware verifies the token and retrieves the current Admin record from MongoDB using `sub`.

### 4.2 Strict Cryptographic Verification

- When protecting routes, `jwt.verify` must explicitly validate:
  ```typescript
  jwt.verify(token, config.jwtSecret, {
    algorithms: ['HS256'],
    issuer: 'doctor-tracker-api',
    audience: 'doctor-tracker-client',
  });
  ```
- Any token with mismatched issuer, audience, expired timestamp, or forged signature immediately throws and is handled as HTTP 401 Unauthorized.

### 4.3 Secret Entropy & Management

- **Generation Command**:
  ```bash
  openssl rand -base64 32
  ```
- **Validation**: At application startup, `config` validates that `JWT_SECRET` is present, has a minimum length of 32 characters, and is not a default placeholder like `"secret"` or `"changeme"`.
- **Security Rule**: Real secrets must never be placed in `.env.example`, source code, or committed to Git.

---

## 5. Protected Route Authorization & Admin Existence Check

The current `Admin` model does **not** feature an `isActive` status flag. Per project rules, we do not invent or add unauthorized fields to the Admin schema.

### Middleware Authorization Logic (`src/middlewares/auth.middleware.ts`):

1. Extract token from `req.cookies.token`. If missing, throw `ApiError.unauthorized("Authentication required. Please log in.")`.
2. Verify token signature, `HS256`, `iss`, `aud`, and `exp`. If invalid/expired, throw `ApiError.unauthorized("Invalid or expired authentication token.")`.
3. Extract `sub` (adminId).
4. Fetch Admin document: `const admin = await Admin.findById(decoded.sub);`.
5. **Existence Check**:
   - If `!admin` (the admin account was deleted or ID is invalid), reject with `ApiError.unauthorized("Admin account no longer exists. Please re-authenticate.")`.
6. Attach `req.admin = admin` to Express request.
7. Call `next()`.

---

## 6. Initial Admin Provisioning (Idempotent Seed Script)

Public admin registration is strictly prohibited. Admin accounts must be created out-of-band.

### 6.1 Script Architecture (`src/scripts/seed-admin.ts`)

- **Execution**: Run manually or via deployment hooks: `pnpm seed:admin`.
- **Do Not Run in Docker Build**: Must only be executed during container runtime deployment (when MongoDB is reachable), never during `docker build`.
- **Configuration Loading**: Loads environment variables using the application's central `dotenv` and `config` module.
- **Inputs**: `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
- **Idempotency & Race Handling**:
  1. Validates presence of credentials.
  2. Normalizes email (`trim().toLowerCase()`).
  3. Checks if `Admin.findOne({ email: normalizedEmail })` exists:
     - If exists: Logs `"Admin account already provisioned. Skipping..."` and exits with code 0.
     - If not exists: Hashes password with `bcrypt.hash(password, 12)` and executes `Admin.create()`.
  4. Catches MongoDB `E11000` duplicate key errors gracefully in the event of concurrent seed runs, treating it as an idempotent success.
  5. Zero secret leakage: No credentials or hashes logged.

---

## 7. Proposed API Contracts

### 7.1 Admin Login

- **Method & Path**: `POST /api/v1/auth/login`
- **Request Body (Zod Validated)**:
  ```json
  {
    "email": "admin@doctortracker.com",
    "password": "AdminPassword#2026"
  }
  ```
- **Validation Rules**:
  - `email`: Required, valid email string, trimmed, lowercase.
  - `password`: Required, minimum 8 characters, maximum 72 bytes.
- **Success Response (`200 OK`)**:
  - **Set-Cookie Header**: `token=<jwt>; HttpOnly; Path=/; Max-Age=3600; SameSite=Lax` (and `Secure` in production).
  - **Body (Safe Profile Only — No Token / No passwordHash)**:
    ```json
    {
      "success": true,
      "message": "Admin authenticated successfully",
      "data": {
        "user": {
          "id": "672901abcf86cd7994390111",
          "name": "System Administrator",
          "email": "admin@doctortracker.com"
        }
      },
      "meta": null
    }
    ```
- **Error Responses**:
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "message": "Invalid email or password combination",
      "errors": null
    }
    ```
  - `422 Unprocessable Entity` (Zod validation failure):
    ```json
    {
      "success": false,
      "message": "Validation failed",
      "errors": [{ "field": "body.email", "message": "Please provide a valid email address" }]
    }
    ```
  - `429 Too Many Requests`:
    ```json
    {
      "success": false,
      "message": "Too many failed login attempts. Please try again after 15 minutes.",
      "errors": null
    }
    ```

### 7.2 Current Admin Profile

- **Method & Path**: `GET /api/v1/auth/me`
- **Authentication**: Required (`authenticate` middleware reads `req.cookies.token`).
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Admin profile retrieved successfully",
    "data": {
      "id": "672901abcf86cd7994390111",
      "name": "System Administrator",
      "email": "admin@doctortracker.com",
      "createdAt": "2026-11-04T15:00:00.000Z",
      "updatedAt": "2026-11-04T15:00:00.000Z"
    },
    "meta": null
  }
  ```
- **Error Responses**:
  - `401 Unauthorized` (Cookie missing, expired, or invalid):
    ```json
    {
      "success": false,
      "message": "Authentication required. Please log in.",
      "errors": null
    }
    ```

### 7.3 Admin Logout

- **Method & Path**: `POST /api/v1/auth/logout`
- **Cookie Clearing**: Issues `Set-Cookie: token=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax` (matching the creation domain, path, and options).
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully",
    "data": {},
    "meta": null
  }
  ```

---

## 8. Accepted Security Trade-offs

1. **Stateless Access Token Without Revocation Blacklist**:
   - _Trade-off_: If an access token cookie is intercepted, it remains valid until its 1-hour expiration, even if the admin logs out.
   - _Rationale_: For an administrative portal with single/few administrators, adding Redis or MongoDB session blacklists creates unnecessary operational complexity and database round-trips on every request. The 1-hour short lifespan effectively limits exposure.
2. **In-Memory Rate Limiting for Single-Instance Evaluation**:
   - _Trade-off_: In a multi-instance auto-scaled cluster, in-memory rate limiting applies per-instance rather than globally.
   - _Rationale_: Avoids introducing a mandatory Redis infrastructure dependency for local evaluation. The architecture is designed to swap to `rate-limit-redis` when multi-container clustering is deployed.
3. **Bcrypt 72-Byte Rejection vs. SHA-256 Pre-Hashing**:
   - _Trade-off_: Passwords exceeding 72 bytes are rejected by Zod validation rather than pre-hashed via SHA-256 before bcrypt.
   - _Rationale_: A 72-byte password provides >400 bits of entropy, which is more than sufficient for any administrative system, while avoiding dual-hashing complexity.

---

## 9. File-by-File Implementation Sequence (Phase 05)

When approved, Phase 05 will be implemented in this exact modular order:

1. **Step 1 — Package Installation**:
   - `pnpm add bcrypt jsonwebtoken cookie-parser`
   - `pnpm add -D @types/bcrypt @types/jsonwebtoken @types/cookie-parser`
2. **Step 2 — Environment & Configuration** ([`src/config/index.ts`](file:///home/shahariyar/Documents/Doctor_Tracker/server/src/config/index.ts) & [`.env.example`](file:///home/shahariyar/Documents/Doctor_Tracker/server/.env.example)):
   - Add `JWT_SECRET` (min 32 chars), `JWT_EXPIRES_IN=1h`, `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` to `Config` interface with startup entropy validation.
3. **Step 3 — Security & Password Utilities** (`src/utils/password.util.ts`, `src/utils/token.util.ts`):
   - `hashPassword(password)` & `comparePassword(password, hash)`.
   - `compareWithDummy(password)` using the pre-generated valid cost factor 12 hash.
   - `signAccessToken(sub)` & `verifyAccessToken(token)` enforcing `HS256`, `iss`, and `aud`.
4. **Step 4 — Zod Auth Validator** (`src/validators/auth.validator.ts`):
   - `loginBodySchema` with byte-length validation (`Buffer.byteLength(val, "utf8") <= 72`) and inferred type `LoginInput`.
5. **Step 5 — Authentication Middleware** (`src/middlewares/auth.middleware.ts`):
   - Extracts `req.cookies.token`.
   - Verifies JWT with `HS256`, `iss`, `aud`.
   - Fetches admin from MongoDB (`Admin.findById(decoded.sub)`).
   - Rejects if admin no longer exists.
   - Attaches `req.admin = admin` via Express `Request` type augmentation.
6. **Step 6 — Auth Controller** (`src/controllers/auth.controller.ts`):
   - `loginHandler` (rate-limited on failures, sets cookie, returns safe profile).
   - `getMeHandler` (returns authenticated admin profile).
   - `logoutHandler` (clears cookie with exact matching options).
7. **Step 7 — Auth Routes** (`src/routes/auth.route.ts` & mounting in `src/routes/index.ts`):
   - Mounts `/auth/login`, `/auth/logout`, `/auth/me`.
8. **Step 8 — Admin Seed Script** (`src/scripts/seed-admin.ts`):
   - Idempotent script wired to `"seed:admin": "tsx src/scripts/seed-admin.ts"` in `package.json`.
9. **Step 9 — App Integration** ([`src/app.ts`](file:///home/shahariyar/Documents/Doctor_Tracker/server/src/app.ts)):
   - Register `cookieParser()` middleware before routes.

---

## 10. Testing & Verification Plan

1. **Static Type Checking & Build**:
   - `pnpm typecheck` (`tsc --noEmit`): Verify 0 diagnostic errors.
   - `pnpm build` (`tsc`): Verify clean compilation to `dist/`.
2. **Admin Provisioning Script**:
   - Execute `pnpm seed:admin` on clean database → verifies admin creation with bcrypt hash.
   - Execute `pnpm seed:admin` a second time → verifies idempotency (exits cleanly without duplicate key error).
3. **Endpoint Tests**:
   - **Login Success**: `POST /api/v1/auth/login` with valid credentials:
     - Returns HTTP 200.
     - `Set-Cookie` header present with `HttpOnly; Path=/; Max-Age=3600`.
     - JSON response contains `data.user` (`id`, `name`, `email`).
     - Response does **not** contain `token` in JSON body.
     - Response does **not** expose `passwordHash`.
   - **Anti-Enumeration / Bad Credentials**:
     - `POST /api/v1/auth/login` with non-existent email → HTTP 401 with generic message.
     - `POST /api/v1/auth/login` with wrong password → HTTP 401 with identical generic message.
     - Response time difference between existing vs non-existing email is negligible (constant-time dummy comparison).
   - **Validation**:
     - Password < 8 characters or > 72 bytes → HTTP 422 Zod error.
     - Invalid email format → HTTP 422 Zod error.
   - **Protected Route Access (`GET /api/v1/auth/me`)**:
     - Request without cookie → HTTP 401 Unauthorized.
     - Request with malformed/forged cookie → HTTP 401 Unauthorized.
     - Request with expired cookie (> 1h) → HTTP 401 Unauthorized.
     - Request with valid cookie → HTTP 200 with admin profile.
   - **Logout (`POST /api/v1/auth/logout`)**:
     - Returns HTTP 200 and issues `Set-Cookie: token=; Max-Age=0; Path=/`.

---

## 11. Risks & Rollback Strategy

- **Risk**: Existing frontend client in `web/` was initially mocked to expect a token in the JSON response (`response.data.token`).
  - _Mitigation_: When the frontend integration phase begins, the frontend `apiClient` will enable `withCredentials: true` and rely on the automatic browser cookie handling, while extracting user info from `response.data.user`.
- **Rollback Strategy**:
  - The entire phase is isolated to new auth files (`src/routes/auth.route.ts`, `src/controllers/auth.controller.ts`, `src/middlewares/auth.middleware.ts`, `src/validators/auth.validator.ts`, `src/scripts/seed-admin.ts`).
  - Reverting the Git commit restoring Phase 04 cleanly rolls back the backend without database corruption or breaking changes.

---

_This document is stored at [`server/ADMIN_AUTH_IMPLEMENTATION_PLAN.md`](file:///home/shahariyar/Documents/Doctor_Tracker/server/ADMIN_AUTH_IMPLEMENTATION_PLAN.md)._
