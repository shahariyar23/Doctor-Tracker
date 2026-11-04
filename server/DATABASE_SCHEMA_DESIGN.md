# Doctor Tracker — MongoDB Database Schema Design Specification (Revised)

> **Phase 02 Architecture Document**  
> **Source of Authority**: Official Doctor Tracker Project Specification PDF & Architecture Decisions.  
> **Status**: Revised Proposal (Strictly conforming to PDF requirements).

---

## 1. Overview & Architectural Principles

The Doctor Tracker database model is designed around three focused entities:
1. **Admin**: Stores authenticated administrator accounts for portal access (Project Specification §2.1).
2. **Doctor**: Stores physician records created and managed by administrators (Project Specification §2.2).
3. **Patient**: Stores patient records associated with specific doctors (Project Specification §2.3).

### Key Architectural Rules
- **Strict Adherence to Project Specification**: Only fields explicitly required by the official PDF are included. Unsupported fields (such as `code`, `status`, `shift`, `age`, `gender`, `notes`, wards, bed charts, or clinical workflow fields) have been removed.
- **Normalized 1-to-N Referencing**: A patient references their assigned doctor via a required Mongoose `ObjectId` (`Patient.assignedDoctorId` referencing `Doctor._id`).
- **No Unbounded Arrays**: Doctors do **not** store an array of patient ObjectIds on their document. This eliminates document size limits (16MB BSON ceiling) and prevents write contention.
- **Guarded Deletion**: Deleting a doctor must **never** cascade-delete patient records. If a doctor has assigned patients, deletion is rejected with an HTTP 409 Conflict.
- **Audit Timestamps**: Automatic `createdAt` and `updatedAt` managed via Mongoose `{ timestamps: true }`.

---

## 2. Revised Mongoose Data Models

### 2.1 Admin Model (`admins` collection)

Used solely for administrator authentication to protect portal routes (Project Specification §2.1). There is **no Doctor Login** or patient authentication.

| Field Name | BSON / Mongoose Type | Required | Unique | Indexed | Description & Validation Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `name` | `String` | Yes | No | No | Trimmed, 2–100 characters. Administrator display name. |
| `email` | `String` | Yes | Yes | Yes | Trimmed, lowercase, valid email format. Unique index for authentication lookup. |
| `passwordHash` | `String` | Yes | No | No | Salted bcrypt hash string. Excluded by default (`select: false`). |
| `createdAt` | `Date` | Auto | No | No | Auto-generated timestamp via `{ timestamps: true }`. |
| `updatedAt` | `Date` | Auto | No | No | Auto-generated timestamp via `{ timestamps: true }`. |

---

### 2.2 Doctor Model (`doctors` collection)

Strictly limited to the 5 fields required by Project Specification §2.2:
- Name
- Specialization
- Hospital
- Phone
- Email

| Field Name | BSON / Mongoose Type | Required | Unique | Indexed | Description & Validation Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `name` | `String` | Yes | No | Yes (Compound) | Trimmed, 2–100 characters. Doctor's full name. |
| `specialization` | `String` | Yes | No | Yes (Compound) | Trimmed, min 2 characters. Medical specialty (e.g., "Cardiology"). |
| `hospital` | `String` | Yes | No | Yes (Compound) | Trimmed, min 2 characters. Healthcare facility affiliation. |
| `phone` | `String` | Yes | No | No | Trimmed, min 5 characters. Contact phone number. No unique constraint per specification. |
| `email` | `String` | Yes | Yes | Yes | Trimmed, lowercase, valid email format. Unique index is an architectural decision to prevent duplicate physician accounts. |
| `createdAt` | `Date` | Auto | No | Yes | Creation timestamp; indexed for date-wise filtering per PDF §2.2. |
| `updatedAt` | `Date` | Auto | No | No | Auto-generated timestamp via `{ timestamps: true }`. |

*Note: Unsupported optional fields (`code`, `status`, `shift`) have been removed.*

---

### 2.3 Patient Model (`patients` collection)

Strictly limited to the approved requirements of Project Specification §2.3 and approved entity fields:
- Name (required)
- Condition (required)
- Assigned Doctor (required reference)
- Age (required)
- Gender (required)
- Phone (optional)

| Field Name | BSON / Mongoose Type | Required | Unique | Indexed | Description & Validation Rules |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `name` | `String` | Yes | No | Yes (Text) | Trimmed, 2–100 characters. Patient's full name. |
| `condition` | `String` | Yes | No | Yes (Compound) | Trimmed, min 2 characters. Flexible string (e.g. "Critical", "Under Treatment", "Stable", "Recovering") to support condition filtering without hardcoded enum lock-in. |
| `assignedDoctorId` | `mongoose.Schema.Types.ObjectId` | Yes | No | Yes (Compound) | Mandatory reference to `Doctor` model (`ref: 'Doctor'`). Every patient must belong to a specific doctor upon creation. |
| `age` | `Number` | Yes | No | No | Integer only (0–120). Patient's age at the time of registration. |
| `gender` | `String` | Yes | No | No | Trimmed, lowercase enum: `male`, `female`, `other`, `prefer_not_to_say`. |
| `phone` | `String` | No | No | Yes (Partial) | Trimmed contact telephone number (optional). Partial index on non-null strings. |
| `createdAt` | `Date` | Auto | No | Yes | Creation timestamp; indexed for date-wise filtering per PDF §2.3 and dashboard trend analytics. |
| `updatedAt` | `Date` | Auto | No | No | Auto-generated timestamp via `{ timestamps: true }`. |

*Note: Unsupported optional fields (`code`, `notes`, wards, medical history) remain removed.*

---

## 3. Doctor–Patient Relationship & Deletion Strategy

### 3.1 Relationship Architecture
- **Cardinality**: `Doctor (1) <---> Patient (N)`.
- **Foreign Key**: `Patient.assignedDoctorId` stores the `Doctor._id`.
- **Querying Patients for a Specific Doctor**:
  ```javascript
  // Retrieve all patients belonging to a specific doctor (PDF §2.2):
  const patients = await Patient.find({ assignedDoctorId: doctorId }).sort({ createdAt: -1 });
  ```
- **Adding a Patient Under a Doctor**:
  - `assignedDoctorId` is mandatory upon patient creation.
- **Deleting a Patient from a Doctor's List**:
  - Directly deletes the specific `Patient` document (`DELETE /api/v1/doctors/:id/patients/:patientId`).

### 3.2 Doctor Deletion Policy: Guarded Conflict Deletion
- **No Cascade Deletion**: Deleting a doctor must **never** cascade-delete patient records.
- **Guarded Conflict Policy**:
  - Before a doctor document can be deleted, the system checks if any patients reference this doctor:
    ```javascript
    const assignedPatientCount = await Patient.countDocuments({ assignedDoctorId: doctorId });
    if (assignedPatientCount > 0) {
      throw ApiError.badRequest(
        `Cannot delete doctor: Doctor has ${assignedPatientCount} assigned patient(s). Remove or reassign patients first.`,
        { assignedPatientCount }
      );
    }
    await Doctor.findByIdAndDelete(doctorId);
    ```
  - This prevents orphan patient records and avoids inventing unapproved unassigned-patient workflows.

---

## 4. Revised Indexing Strategy

All proposed indexes are strictly justified by actual search, filtering, sorting, and relationship query patterns. Unnecessary single-field and redundant indexes have been removed.

### 4.1 Admin Collection
1. `{ email: 1 }` (Unique):
   - **Justification**: Enforces single administrative account per email and ensures `O(1)` query performance during login (`findOne({ email })`).

### 4.2 Doctor Collection
1. `{ email: 1 }` (Unique):
   - **Justification**: Enforces email uniqueness across doctors and optimizes direct lookups by email.
2. `{ createdAt: -1 }`:
   - **Justification**: Satisfies mandatory date-wise filtering (`startDate`, `endDate`) per PDF §2.2 and default reverse-chronological pagination.
3. `{ specialization: 1, createdAt: -1 }` (Compound Index):
   - **Justification**: Optimizes filtering by specialty combined with sorted pagination.
4. **Search Strategy Decision**:
   - **Recommendation**: Regex Prefix / Text Index.
   - For case-insensitive search by physician name, specialty, and hospital (`PDF §2.2`), a compound text index `{ name: "text", specialization: "text", hospital: "text" }` allows fast indexed multi-field search without expensive full-collection regex scans.
   - Alternatively, if prefix search is preferred, compound index on `{ name: 1, hospital: 1 }` can be used.

### 4.3 Patient Collection
1. `{ assignedDoctorId: 1, createdAt: -1 }` (Compound Index):
   - **Justification**: Optimizes the primary relational query — retrieving and paginating a specific doctor's patients in reverse-chronological order (`PDF §2.2`).
2. `{ condition: 1, createdAt: -1 }` (Compound Index):
   - **Justification**: Optimizes mandatory condition-based filtering (`PDF §2.3`) combined with sorted pagination.
3. `{ createdAt: -1 }`:
   - **Justification**: Optimizes global patient date-wise filtering (`PDF §2.3`) and dashboard registration trend aggregations (`PDF §3`).
4. **Search Strategy Decision**:
   - For searching patients by name (`PDF §2.3`), a text index `{ name: "text" }` or prefix index `{ name: 1 }` prevents unindexed table scans.

---

## 5. Mapping Between PDF, Frontend Contracts, and Database Fields

| Entity | PDF Requirement | Database Field | Type | Validation Rules |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Secure authentication (§2.1) | `email` | `String` | Required, unique, lowercase, trimmed |
| | | `passwordHash` | `String` | Required, bcrypt hash, `select: false` |
| | | `name` | `String` | Required, trimmed, 2–100 chars |
| **Doctor** | Name (§2.2) | `name` | `String` | Required, trimmed, 2–100 chars |
| | Specialization (§2.2) | `specialization` | `String` | Required, trimmed, min 2 chars |
| | Hospital (§2.2) | `hospital` | `String` | Required, trimmed, min 2 chars |
| | Phone (§2.2) | `phone` | `String` | Required, trimmed, non-unique |
| | Email (§2.2) | `email` | `String` | Required, unique, lowercase, trimmed |
| **Patient** | Name (§2.3) | `name` | `String` | Required, trimmed, 2–100 chars |
| | Condition (§2.3) | `condition` | `String` | Required, trimmed, flexible string |
| | Assigned Doctor (§2.2, §2.3) | `assignedDoctorId` | `ObjectId` | Required, `ref: 'Doctor'` |
| | Phone (Optional) | `phone` | `String` | Optional, trimmed |

---

## 6. Summary of Architectural Decisions & Next Steps

1. **Unsupported Fields Eliminated**: All non-PDF fields (`code`, `status`, `shift`, `age`, `gender`, `notes`) have been pruned.
2. **Mandatory Doctor Assignment**: `Patient.assignedDoctorId` is required. No unassigned-patient workflow is introduced.
3. **Guarded Doctor Deletion**: Prevents deletion of doctors with assigned patients, avoiding orphan records or silent data loss.
4. **Flexible Condition String**: `condition` remains a clean, validated `String` instead of an artificial enum.
5. **No Doctor Login**: Only Admin authentication will be implemented.

*Awaiting your approval before proceeding to Phase 03 (Mongoose Model Implementation).*
