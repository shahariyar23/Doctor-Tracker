# Doctor Tracker Backend — JavaScript to TypeScript Migration Plan (Revised)

> **Scope**: Safe, incremental migration of `server/` from JavaScript (ESM) to TypeScript.  
> **Status**: Revised Specification (Awaiting Approval — Zero application files modified or deleted during audit).

---

## 1. Current Backend Structure & Baseline Audit

### 1.1 Verified Source File Inventory (`server/src/`)
Actual filesystem audit confirms exactly **16 JavaScript source files** in `server/src/`:

1. `src/server.js` (Server startup, DB connect, graceful shutdown)
2. `src/app.js` (Express app initialization, Helmet, CORS, Morgan, JSON/URL parsers)
3. `src/config/index.js` (Environment variable configuration via `dotenv`)
4. `src/config/db.js` (Mongoose connection logic)
5. `src/models/admin.model.js` (Admin Mongoose Schema and Model)
6. `src/models/doctor.model.js` (Doctor Mongoose Schema, Model, and Indexes)
7. `src/models/patient.model.js` (Patient Mongoose Schema, Model, and Partial Indexes)
8. `src/models/index.js` (Barrel re-exports for models)
9. `src/routes/index.js` (API v1 root router)
10. `src/routes/health.route.js` (Health router)
11. `src/controllers/health.controller.js` (Health controller)
12. `src/middlewares/not-found.middleware.js` (404 handler)
13. `src/middlewares/error.middleware.js` (Global centralized error handler)
14. `src/utils/api-error.js` (Custom `ApiError` class)
15. `src/utils/api-response.js` (Standard `ApiResponse` wrapper)
16. `src/utils/async-handler.js` (Async route wrapper)

### 1.2 Current `package.json` Dependencies
- **Runtime**:
  - `express`: `5.3.0`
  - `dotenv`: `18.0.9`
  - `mongoose`: `9.11.4` (includes built-in types)
  - `cors`: `2.8.6`
  - `helmet`: `8.3.0` (includes built-in types)
- **Dev Dependencies**:
  - `morgan`: `1.12.1`
  - `nodemon`: `3.1.14`

---

## 2. Required TypeScript Dependencies & Express 5 Compatibility

The following dependencies will be installed in `server/` as `devDependencies`:

| Package | Version / Tag | Purpose & Compatibility Notes |
| :--- | :--- | :--- |
| `typescript` | `^5.8.0` | Core TypeScript compiler (`tsc`). |
| `tsx` | `^4.19.0` | Ultra-fast Node.js TypeScript runner with native ESM watch mode (`tsx watch`). Replaces `nodemon`. |
| `@types/node` | `^22.0.0` | Type definitions for Node.js runtime (events, process, net, streams). |
| `@types/express` | `^5.0.0` (`5.0.6`) | Specifically targeting **Express 5** (`@types/express-serve-static-core: ^5.0.0`), aligning with installed `express@5.3.0`. |
| `@types/cors` | `^2.8.17` | Type definitions for CORS middleware options. |
| `@types/morgan` | `^1.9.9` | Type definitions for Morgan HTTP request logger. |

*Self-typed packages*:
- `mongoose@9.11.4`: Ships with built-in official TypeScript declarations (`HydratedDocument`, `Model`, `Schema`, `Types.ObjectId`).
- `helmet@8.3.0`: Ships with built-in declarations.
- `dotenv@18.0.9`: Ships with built-in declarations.

---

## 3. Proposed TypeScript Configuration (`server/tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "declaration": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### ESM Architecture & Import Specifiers:
Under `"module": "NodeNext"`, TypeScript strictly adheres to ECMAScript standard module resolution. In accordance with Node.js ESM requirements, **all relative internal imports in `.ts` files must specify explicit `.js` extensions** (e.g. `import app from "./app.js";`, `import { config } from "./config/index.js";`). This matches the existing ESM architecture and avoids compilation or runtime module resolution failures.

---

## 4. Advanced Mongoose Typing Strategy

To preserve all approved database schemas, indexes, defaults, and serialization behavior while providing end-to-end type safety:

### 4.1 Document Interfaces & Types

```typescript
import mongoose, { Document, Model, HydratedDocument, Types } from "mongoose";

// 1. Admin Model Typing
export interface IAdmin {
  name: string;
  email: string;
  passwordHash: string;
  createdAt?: Date;
  updatedAt?: Date;
}
export type AdminDocument = HydratedDocument<IAdmin>;
export type AdminModel = Model<IAdmin>;

// 2. Doctor Model Typing
export interface IDoctor {
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}
export type DoctorDocument = HydratedDocument<IDoctor>;
export type DoctorModel = Model<IDoctor>;

// 3. Patient Model Typing
export interface IPatient {
  name: string;
  condition: string;
  assignedDoctorId: Types.ObjectId; // Strict MongoDB ObjectId type
  phone?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
export type PatientDocument = HydratedDocument<IPatient>;
export type PatientModel = Model<IPatient>;
```

### 4.2 Preservation Guarantees:
- **No Schema Changes**: The exact approved fields, trimmed options, minlength/maxlength validations, and regex patterns are preserved.
- **Indexes Unchanged**:
  - Doctor: `{ email: 1 }` (unique), `{ createdAt: -1 }`, `{ specialization: 1, createdAt: -1 }`, and text index on `{ name, specialization, hospital }`.
  - Patient: `{ assignedDoctorId: 1, createdAt: -1 }`, `{ condition: 1, createdAt: -1 }`, `{ createdAt: -1 }`, `{ name: "text" }`, and the approved partial index on `{ phone: 1 }` with `{ partialFilterExpression: { phone: { $type: "string" } } }`.
- **Security Serialization**:
  - `passwordHash` remains `select: false` with the `toJSON` transform `delete ret.passwordHash`.
- **Recompilation Protection**:
  - `mongoose.models.Doctor || mongoose.model<IDoctor, DoctorModel>("Doctor", doctorSchema)`.

---

## 5. Middleware & Error Handling Typing (Type Narrowing with `unknown`)

In compliance with strict TypeScript best practices, `any` is eliminated from the error handling middleware:

```typescript
import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { ApiError } from "../utils/api-error.js";
import { config } from "../config/index.js";

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let error: ApiError;

  // Type narrowing without using 'any'
  if (err instanceof ApiError) {
    error = err;
  } else if (err instanceof Error) {
    const statusCode =
      "statusCode" in err && typeof (err as { statusCode: unknown }).statusCode === "number"
        ? (err as { statusCode: number }).statusCode
        : 500;
    error = new ApiError(statusCode, err.message, null, err.stack);
  } else {
    error = new ApiError(500, "Something went wrong");
  }

  const response: { success: false; message: string; errors: unknown; stack?: string } = {
    success: false,
    message: error.message || "Something went wrong",
    errors: error.errors || null,
  };

  if (config.env === "development") {
    response.stack = error.stack;
  }

  res.status(error.statusCode).json(response);
};
```

---

## 6. Complete File-by-File Migration Mapping (`.js` → `.ts`)

All **16 source files** mapped:

| # | Current File | Target File | Key TypeScript Typing Details |
| :---: | :--- | :--- | :--- |
| 1 | `src/config/index.js` | `src/config/index.ts` | Interface `Config` (`env`, `port`, `clientUrl`, `mongoUri`). Strict fallback parsing. |
| 2 | `src/config/db.js` | `src/config/db.ts` | Return type `Promise<typeof mongoose>`. Type narrowing for connection error. |
| 3 | `src/utils/api-error.js` | `src/utils/api-error.ts` | Strongly typed constructor: `statusCode: number`, `message: string`, `errors: unknown = null`, `stack: string = ""`. |
| 4 | `src/utils/api-response.js` | `src/utils/api-response.ts` | Generic class `ApiResponse<T = unknown>`. Typed `Response` parameters for static helpers. |
| 5 | `src/utils/async-handler.js` | `src/utils/async-handler.ts` | Type signature: `(fn: RequestHandler) => RequestHandler`. Fully typed `Request`, `Response`, `NextFunction`. |
| 6 | `src/middlewares/not-found.middleware.js` | `src/middlewares/not-found.middleware.ts` | Typed as `RequestHandler`. |
| 7 | `src/middlewares/error.middleware.js` | `src/middlewares/error.middleware.ts` | Typed as `ErrorRequestHandler` with `err: unknown` and safe narrowing. |
| 8 | `src/controllers/health.controller.js` | `src/controllers/health.controller.ts` | Typed `getHealthStatus: RequestHandler`. Typed `healthData` object structure. |
| 9 | `src/routes/health.route.js` | `src/routes/health.route.ts` | Typed `Router` from `express`. |
| 10 | `src/routes/index.js` | `src/routes/index.ts` | Typed root `Router`. |
| 11 | `src/models/admin.model.js` | `src/models/admin.model.ts` | Interfaces `IAdmin`, `AdminDocument`, `AdminModel`. Preserves `{ select: false }` and `toJSON`. |
| 12 | `src/models/doctor.model.js` | `src/models/doctor.model.ts` | Interfaces `IDoctor`, `DoctorDocument`, `DoctorModel`. Preserves all 4 approved indexes. |
| 13 | `src/models/patient.model.js` | `src/models/patient.model.ts` | Interfaces `IPatient`, `PatientDocument`, `PatientModel`. Preserves `Types.ObjectId` reference and partial index. |
| 14 | `src/models/index.js` | `src/models/index.ts` | Type re-exports (`export * from ...`). |
| 15 | `src/app.js` | `src/app.ts` | Typed `Application` from `express`. |
| 16 | `src/server.js` | `src/server.ts` | Typed `http.Server` instance and `NodeJS.Signals` in graceful shutdown. |

---

## 7. Migration Execution & Safety Protocol

To guarantee zero downtime and prevent file loss:

### 7.1 Git Safety Checkpoint
Before any file conversion begins:
- Verify git status: Ensure clean working directory.
- Create git commit or reference checkpoint (`git add -A && git commit -m "checkpoint: pre-typescript migration"`).
- **Rule**: Do **NOT** overwrite or delete any `.js` source file until the newly created `.ts` files pass full TypeScript compilation and runtime verification.

### 7.2 Incremental Step Sequence
1. **Step 1 — Tooling Installation**:
   Install `typescript`, `tsx`, `@types/node`, `@types/express@5`, `@types/cors`, `@types/morgan` via `pnpm add -D`.
2. **Step 2 — Configuration Setup**:
   Create `server/tsconfig.json` with strict NodeNext settings.
3. **Step 3 — Core Types & Utilities Migration**:
   Create `.ts` versions of config and utilities (`api-error.ts`, `api-response.ts`, `async-handler.ts`).
4. **Step 4 — Models Migration**:
   Create `.ts` versions of `admin.model.ts`, `doctor.model.ts`, `patient.model.ts`, and `index.ts`.
5. **Step 5 — Middlewares, Controllers & Routes Migration**:
   Create `.ts` versions of middlewares, controllers, and routes with Express 5 types and `unknown` error handling.
6. **Step 6 — App & Server Migration**:
   Create `app.ts` and `server.ts`.
7. **Step 7 — Build & Verification**:
   - Run `pnpm exec tsc --noEmit` to verify type checking across all 16 files.
   - Run `pnpm exec tsc` to test production emission into `dist/`.
   - Update `package.json` scripts (`dev`, `build`, `start`, `typecheck`).
   - Run `pnpm dev` and verify live `GET /api/v1/health` response.
   - Inspect Mongoose schema indexes on compiled models.
8. **Step 8 — Safe JS Removal**:
   Only after all verification steps pass, remove the legacy `.js` source files.

---

## 8. Verification Plan & Target Metrics

| Verification Task | Command / Method | Expected Output / Acceptance Criteria |
| :--- | :--- | :--- |
| **Type Checking** | `pnpm typecheck` (`tsc --noEmit`) | `Exit code 0`, 0 diagnostic errors. |
| **Production Build** | `pnpm build` (`tsc`) | Clean `dist/` directory matching source structure with valid `.js` and sourcemaps. |
| **Runtime Dev Server** | `pnpm dev` (`tsx watch src/server.ts`) | Server listens on configured port without uncaught exceptions. |
| **Health Check API** | `curl -s http://localhost:5000/api/v1/health` | HTTP 200 with standard response format: `{ "success": true, "message": "...", "data": { ... }, "meta": null }`. |
| **404 / Error Format** | `curl -s http://localhost:5000/api/v1/unknown` | HTTP 404 with standard error format: `{ "success": false, "message": "...", "errors": null }`. |
| **Index Verification** | Introspect `schema.indexes()` on Doctor & Patient | Doctor: 4 approved indexes. Patient: 5 approved indexes (including partial phone index). |

---

*This revised plan is saved in [`server/TYPESCRIPT_MIGRATION_PLAN.md`](file:///home/shahariyar/Documents/Doctor_Tracker/server/TYPESCRIPT_MIGRATION_PLAN.md). No source files have been modified yet.*
