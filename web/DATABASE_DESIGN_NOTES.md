# Doctor Tracker — Database Design Notes & Query Requirements

> **Notice**: These notes synthesize data requirements derived directly from the official Project Specification PDF and the active frontend application (`web/`). They serve as architectural guidance for future MongoDB and Mongoose schema design. No backend schemas or database models are implemented in this phase.

---

## 1. Confirmed Entities & Fields

### 1.1 Doctor Entity
Source: Project Specification §2.2 & Frontend Doctor Views.

| Field | Type | Required | Constraints / Values | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `name` | String | Yes | Trimmed, 2–100 chars | Doctor's full name |
| `specialization` | String | Yes | Trimmed, indexed | Medical specialty (e.g., "Cardiology") |
| `hospital` | String | Yes | Trimmed, indexed | Hospital or healthcare facility affiliation |
| `phone` | String | Yes | Unique index, trimmed | Contact phone number |
| `email` | String | Yes | Unique index, lowercase, trimmed | Contact email address |
| `code` | String | Optional | Unique format (e.g. `#DOC-1042`) | Human-readable identifier |
| `status` | String | Optional | Enum: `Active`, `Available`, `On Leave`, `At Capacity` (default: `Active`) | Operational status |
| `shift` | String | Optional | Enum: `Morning`, `Evening`, `Night` | Assigned duty shift |
| `maxCapacity` | Number | Optional | Default: `35` | Caseload capacity ceiling |
| `patientCount` | Number | Calculated / Cached | Minimum `0` | Number of currently assigned patients |
| `createdAt` | Date | Auto | Timestamps | Date of creation |
| `updatedAt` | Date | Auto | Timestamps | Date of last update |

### 1.2 Patient Entity
Source: Project Specification §2.3 & Frontend Patient Views.

| Field | Type | Required | Constraints / Values | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `name` | String | Yes | Trimmed, 2–100 chars | Patient's full name |
| `phone` | String | Yes | Trimmed | Contact phone number |
| `condition` | String | Yes | Enum: `Critical`, `Under Treatment`, `Stable`, `Recovering` | Health/triage condition |
| `status` | String | Yes | Enum: `Active`, `Inactive`, `Archived` (default: `Active`) | Inpatient/outpatient status |
| `code` | String | Optional | Unique MRN format (e.g. `#MRN-8492`) | Medical Record Number |
| `age` | Number | Optional | 0–130 | Patient age in years |
| `gender` | String | Optional | Enum: `Male`, `Female`, `Other` | Gender identity |
| `bloodGroup` | String | Optional | Blood group notation | Optional clinical note |
| `roomNumber` | String | Optional | Inpatient room/bed code | Facility assignment |
| `assignedDoctorId` | ObjectId / null | Optional | Ref: `Doctor` | Reference to assigned attending doctor |
| `notes` | String | Optional | Free text notes | Clinical/reassignment remarks |
| `createdAt` | Date | Auto | Timestamps | Registration date |
| `updatedAt` | Date | Auto | Timestamps | Last profile change |

### 1.3 Admin User Entity
Source: Project Specification §2.1.

| Field | Type | Required | Constraints / Values | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `email` | String | Yes | Unique index, lowercase, trimmed | Admin login credential |
| `password` | String | Yes | Bcrypt hash | Authentication password |
| `name` | String | Yes | Trimmed | Admin display name |
| `role` | String | Yes | Enum: `admin` | Portal authorization role |

---

## 2. Doctor-Patient Relationship

- **Relationship Model**: One-to-Many (`Doctor 1 : N Patient`).
- **Referential Integrity**:
  - `Patient.assignedDoctorId` stores an `ObjectId` referencing the `Doctor` document (nullable when a patient is unassigned).
  - Doctors do **not** store an array of patient ObjectIds on their document to prevent unbounded array growth and document bloat in MongoDB.
  - Doctor's caseload can either be computed on demand via aggregation (`$lookup` / `countDocuments`) or maintained via an atomic cached counter `patientCount` incremented/decremented when patients are assigned/unassigned.

---

## 3. Query, Search & Indexing Recommendations

### 3.1 Doctor Collection Indexes
1. **Compound Search Index**:
   ```javascript
   // Text or compound index for searching doctors by name, specialization, hospital, email
   { name: "text", specialization: "text", hospital: "text", email: "text" }
   ```
2. **Filtering Indexes**:
   ```javascript
   { specialization: 1, status: 1 }
   { createdAt: -1 }
   ```
3. **Unique Indexes**:
   ```javascript
   { email: 1 } // unique: true
   { code: 1 }  // unique: true, sparse: true
   ```

### 3.2 Patient Collection Indexes
1. **Attending Doctor Lookup**:
   ```javascript
   { assignedDoctorId: 1, status: 1 }
   ```
2. **Compound Filtering Indexes**:
   ```javascript
   { condition: 1, createdAt: -1 }
   { status: 1, createdAt: -1 }
   ```
3. **Search Index**:
   ```javascript
   { name: "text", phone: "text", code: "text" }
   ```
4. **Unique Indexes**:
   ```javascript
   { code: 1 } // unique: true, sparse: true
   ```

---

## 4. Date Filtering Requirements

- Both Doctor and Patient listings support `startDate` and `endDate` queries for date-range filtering.
- Query implementation pattern in MongoDB:
  ```javascript
  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);
  if (Object.keys(dateFilter).length) query.createdAt = dateFilter;
  ```
- Fast date-range scans require single-field indexes on `createdAt: -1`.

---

## 5. Dashboard Aggregation Requirements

To power the dashboard without multiple round-trips:
1. **KPI Metrics**:
   - `totalDoctors`: `Doctor.countDocuments()`
   - `totalPatients`: `Patient.countDocuments()`
   - `patientsPerDoctor`: Calculated quotient
   - `assignedPatients`: `Patient.countDocuments({ assignedDoctorId: { $ne: null } })`
   - `unassignedPatients`: `Patient.countDocuments({ assignedDoctorId: null })`
2. **Trends**:
   - MongoDB `$group` on `createdAt` bucketed by day for the selected timeframe (`$gte: 30 days ago`).
3. **Workload**:
   - Top 5 doctors by patient count: `$sort: { patientCount: -1 }, $limit: 5`.
4. **Condition Distribution**:
   - MongoDB `$group` by `$condition` with `$sum: 1`.

---

## 6. Distinguishing Requirements vs Frontend Assumptions

| Requirement | Source | Status |
| :--- | :--- | :--- |
| Doctor: Name, Specialization, Hospital, Phone, Email | Project Specification §2.2 | **Confirmed Mandatory** |
| Patient: CRUD, Condition, Filter, Search, Pagination | Project Specification §2.3 | **Confirmed Mandatory** |
| Admin-Only Authentication | Project Specification §2.1 | **Confirmed Mandatory** |
| Doctor: Shift (`Morning`, `Evening`, `Night`) | Frontend UI enhancement | **Optional Schema Field** |
| Doctor: `maxCapacity` (35) | Frontend UI enhancement | **Optional Schema Field** |
| Patient: `roomNumber`, `bloodGroup` | Frontend UI enhancement | **Optional Schema Field** |
| Bulk Doctor/Patient deletion & status updates | Frontend UI feature | **Supported API extension** |

