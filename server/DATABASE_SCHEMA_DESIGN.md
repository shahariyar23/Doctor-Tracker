# Doctor Tracker — MongoDB Database Schema Design Specification

> **Phase 02 Architecture Document**  
> **Source of Authority**: Official Doctor Tracker Project Specification PDF & Frontend Data Contracts (`web/API_CONTRACT.md`, `web/DATABASE_DESIGN_NOTES.md`).

---

## 1. Overview & Architectural Principles

The Doctor Tracker database model is designed around three core entities:
1. **Admin**: Stores authenticated administrative portal accounts.
2. **Doctor**: Stores physician directory records created and managed by administrators.
3. **Patient**: Stores patient records, including clinical condition and doctor assignments.

### Key Architectural Guidelines
- **Normalized Reference Architecture**: Use 1-to-N normalized referencing via Mongoose `ObjectId` references (`Patient.assignedDoctorId` referencing `Doctor._id`).
- **No Unbounded Arrays**: Doctors do **not** store an array of patient IDs on the Doctor document. This prevents document growth beyond the 16MB BSON limit and eliminates write contention when patients are added/updated/removed.
- **Strict Separation of Mandatory vs. UI-Optional Fields**: Strict conformance to Project Specification §2.2 and §2.3. No invented clinical/hospital workflows (no wards, bed charts, diagnosis histories, doctor login, or patient auth).
- **Audit Timestamps**: Automatic `createdAt` and `updatedAt` managed via Mongoose `{ timestamps: true }`.

---

## 2. Proposed Mongoose Data Models

### 2.1 Admin Model (`admins` collection)

Used solely for administrator authentication to protect portal routes (Project Specification §2.1).

| Field Name | BSON / Mongoose Type | Required | Unique | Indexed | Description / Validation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `name` | `String` | Yes | No | No | Trimmed, 2–100 characters. Admin display name. |
| `email` | `String` | Yes | Yes | Yes | Trimmed, lowercase, validated email format. |
| `passwordHash` | `String` | Yes | No | No | Secure salted bcrypt hash string. Excluded from default queries (`select: false`). |
| `role` | `String` | Yes | No | No | Defaults to `"admin"`. Restricts access to administrative capabilities. |
| `createdAt` | `Date` | Auto | No | No | Creation timestamp (via `{ timestamps: true }`). |
| `updatedAt` | `Date` | Auto | No | No | Last update timestamp (via `{ timestamps: true }`). |

---

### 2.2 Doctor Model (`doctors` collection)

Represents physician profiles. Mandatory fields are derived directly from Project Specification §2.2:
- Name
- Specialization
- Hospital
- Phone
- Email

| Field Name | BSON / Mongoose Type | Required | Unique | Indexed | Description / Validation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `name` | `String` | Yes | No | Text / Comp. | Trimmed, 2–100 chars. Mandatory per PDF §2.2. |
| `specialization` | `String` | Yes | No | Text / Comp. | Trimmed, min 2 chars (e.g. "Cardiology"). Mandatory per PDF §2.2. |
| `hospital` | `String` | Yes | No | Text / Comp. | Trimmed, min 2 chars. Affiliated facility. Mandatory per PDF §2.2. |
| `phone` | `String` | Yes | Yes | Yes | Trimmed, valid telephone format. Unique to avoid duplicate doctor entries. |
| `email` | `String` | Yes | Yes | Yes | Trimmed, lowercase, valid email. Unique to prevent duplicates. |
| `createdAt` | `Date` | Auto | No | Yes | Creation timestamp; indexed for date-wise filtering per PDF §2.2. |
| `updatedAt` | `Date` | Auto | No | No | Last modification timestamp. |

#### Optional Frontend-Aligned Schema Fields (Non-breaking enhancements):
- `code` (`String`, optional, unique sparse index): Formatted physician code (e.g. `#DOC-1042`).
- `status` (`String`, optional, default: `"Active"`): Status flags (`"Active"`, `"Available"`, `"On Leave"`, `"At Capacity"`).
- `shift` (`String`, optional): `"Morning"`, `"Evening"`, or `"Night"`.

---

### 2.3 Patient Model (`patients` collection)

Represents patient records per Project Specification §2.3.

| Field Name | BSON / Mongoose Type | Required | Unique | Indexed | Description / Validation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `name` | `String` | Yes | No | Text / Comp. | Trimmed, 2–100 chars. Mandatory per PDF §2.3. |
| `condition` | `String` | Yes | No | Yes | Trimmed. Required for condition-wise filtering per PDF §2.3 (e.g. "Critical", "Under Treatment", "Stable", "Recovering"). Not hardcoded to rigid enums to allow flexibility. |
| `assignedDoctorId` | `mongoose.Schema.Types.ObjectId` | No (nullable) | No | Yes | Reference to `Doctor` model (`ref: 'Doctor'`). Null if unassigned. |
| `phone` | `String` | No (optional) | No | No | Trimmed contact telephone. |
| `createdAt` | `Date` | Auto | No | Yes | Registration timestamp; indexed for date-wise filtering per PDF §2.3. |
| `updatedAt` | `Date` | Auto | No | No | Last modification timestamp. |

#### Optional Frontend-Aligned Schema Fields (Non-breaking enhancements):
- `code` (`String`, optional, unique sparse index): Medical Record Number (MRN) (e.g. `#MRN-8492`).
- `notes` (`String`, optional): Clinical or assignment notes from doctor patient list modal.
- `age` (`Number`, optional): Patient age (0–130).
- `gender` (`String`, optional): `"Male"`, `"Female"`, `"Other"`.

---

## 3. Relationships & Referential Integrity

### 3.1 Doctor–Patient Relationship Model
- **Cardinality**: `Doctor (1) <---> Patient (N)`.
- **Foreign Key**: `Patient.assignedDoctorId` stores `Doctor._id`.
- **Querying Patients by Doctor**:
  ```javascript
  // Retrieve all patients belonging to a specific doctor:
  const patients = await Patient.find({ assignedDoctorId: doctorId }).sort({ createdAt: -1 });
  ```
- **Aggregation for Analytics & Caseload**:
  Caseload counts (`patientsPerDoctor`, `patientCount`) are aggregated dynamically using `$group` or `$lookup`:
  ```javascript
  // Dynamic aggregation of patient count per doctor:
  const caseload = await Patient.aggregate([
    { $match: { assignedDoctorId: { $ne: null } } },
    { $group: { _id: "$assignedDoctorId", patientCount: { $sum: 1 } } }
  ]);
  ```

### 3.2 Doctor Deletion Behavior & Strategy
When a doctor is deleted via `DELETE /api/v1/doctors/:id`, the system must prevent **orphan patient records** or **silent patient loss**:
- **Strategy (Recommended: Safe Unassign with Audit)**:
  1. **Disallow Cascade Deletion**: Deleting a doctor must **never** delete the patient documents from the database.
  2. **Atomic Reassignment to Null**: In a database transaction (or coordinated operation), all patients assigned to the deleted doctor have their `assignedDoctorId` set to `null`:
     ```javascript
     await Patient.updateMany(
       { assignedDoctorId: doctorId },
       { $set: { assignedDoctorId: null } }
     );
     await Doctor.findByIdAndDelete(doctorId);
     ```
  3. **Alternative Option (Guarded Deletion)**: If strict business rules require it, reject deletion of a doctor with active assigned patients until the admin explicitly reassigns them.
  - *Recommendation*: Support safe unassigning (`assignedDoctorId = null`) so unassigned patients appear in the patient directory under the "Unassigned" filter for reassignment.

---

## 4. Indexing Strategy

Indexing is optimized to directly satisfy Project Specification §5 (Searching, Filtering, Pagination, and Aggregation):

### 4.1 Admin Collection Indexes
1. `{ email: 1 }` (Unique):
   - **Reason**: O(1) lookups during admin authentication (`findOne({ email })`), enforcing email uniqueness.

### 4.2 Doctor Collection Indexes
1. `{ email: 1 }` (Unique):
   - **Reason**: Prevents duplicate doctor registrations.
2. `{ phone: 1 }` (Unique):
   - **Reason**: Prevents duplicate contact numbers.
3. `{ createdAt: -1 }`:
   - **Reason**: Satisfies date-wise filtering (`startDate`/`endDate`) and default reverse-chronological pagination.
4. `{ name: "text", specialization: "text", hospital: "text", email: "text" }` (Text Index):
   - **Reason**: Satisfies search requirements per PDF §2.2 across physician name, specialty, facility, and email.
5. `{ specialization: 1, createdAt: -1 }` (Compound Index):
   - **Reason**: Optimizes specialty-based filtering combined with paginated sorting.

### 4.3 Patient Collection Indexes
1. `{ assignedDoctorId: 1, createdAt: -1 }` (Compound Index):
   - **Reason**: Extremely fast retrieval of a doctor's patient list (`/doctors/:id/patients`) and unassigned patient lookups.
2. `{ condition: 1, createdAt: -1 }` (Compound Index):
   - **Reason**: Satisfies mandatory condition filtering combined with pagination per PDF §2.3.
3. `{ createdAt: -1 }`:
   - **Reason**: Satisfies mandatory date-wise filtering per PDF §2.3 and dashboard trend aggregations.
4. `{ name: "text", phone: "text" }` (Text Index):
   - **Reason**: Satisfies patient search per PDF §2.3.

---

## 5. Mapping: Frontend API Contracts to Database Fields

| Frontend API Contract Field | Target Mongoose Model | Database Field | Transformation / Storage |
| :--- | :--- | :--- | :--- |
| `id` | Doctor / Patient / Admin | `_id` | Mongoose `_id.toString()` transformed to `id` in JSON serialization |
| `name` | Doctor / Patient / Admin | `name` | Trimmed `String` |
| `specialization` | Doctor | `specialization` | Trimmed `String` |
| `hospital` | Doctor | `hospital` | Trimmed `String` |
| `phone` | Doctor / Patient | `phone` | Trimmed `String` |
| `email` | Doctor / Admin | `email` | Trimmed lowercase `String` |
| `condition` | Patient | `condition` | Trimmed `String` |
| `assignedDoctorId` | Patient | `assignedDoctorId` | `mongoose.Types.ObjectId` (nullable) |
| `createdAt` | All Models | `createdAt` | ISO Date (auto-managed) |
| `updatedAt` | All Models | `updatedAt` | ISO Date (auto-managed) |

---

## 6. Assumptions & Architectural Clarifications

1. **Authentication Scope**:
   - Only **Admin** accounts exist in the `Admin` model. Doctors do not have credentials or portal login capability per the Project Specification and instructions.
2. **Patient Condition Flexibility**:
   - The specification mandates condition-based filtering without restricting values to a fixed medical list. The schema enforces `type: String, required: true`, permitting standard conditions (`Critical`, `Under Treatment`, `Stable`, `Recovering`) without rigid database enum lock-in.
3. **Caseload Computation**:
   - Instead of storing duplicate counters that can fall out of sync, `patientCount` per doctor can be populated dynamically during `/doctors` queries via MongoDB aggregation `$lookup` or `$countDocuments`.

