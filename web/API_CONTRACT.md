# Doctor Tracker — API Contract Specification

> **Notice**: All endpoint paths, parameters, schemas, and payloads documented below represent proposed REST API contracts derived directly from the Doctor Tracker Project Specification and the active Next.js frontend requirements. These contracts serve as the canonical blueprint for backend implementation.

---

## 1. Standard API Response Formats

All API endpoints must return a unified JSON response envelope conforming to one of the two standard structures below:

### 1.1 Success Response Envelope
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {},
  "meta": null
}
```

- `success` (`boolean`): Always `true` for `2xx` responses.
- `message` (`string`): Human-readable confirmation of the completed operation.
- `data` (`object` | `array`): The payload requested or created/updated.
- `meta` (`object` | `null`): Standard pagination metadata when fetching list resources, otherwise `null`.

### 1.2 Error Response Envelope
```json
{
  "success": false,
  "message": "Something went wrong",
  "errors": null
}
```

- `success` (`boolean`): Always `false` for `4xx` and `5xx` responses.
- `message` (`string`): Descriptive error message.
- `errors` (`array` | `object` | `null`): Array of validation issues with specific field names, or `null`.

---

## 2. Standard Pagination & Filtering

### 2.1 Pagination Metadata Envelope (`meta`)
```json
{
  "page": 1,
  "limit": 10,
  "total": 148,
  "totalPages": 15
}
```

### 2.2 Standard Query Parameters
All paginated collection endpoints support the following uniform query parameters:
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `page` | integer | No | `1` | 1-indexed page number |
| `limit` | integer | No | `10` | Records per page (max recommended: 50) |
| `search` | string | No | `""` | Case-insensitive substring match |
| `startDate` | string | No | `""` | ISO 8601 or YYYY-MM-DD range start filter |
| `endDate` | string | No | `""` | ISO 8601 or YYYY-MM-DD range end filter |

---

## 3. Authentication API Contracts

### 3.1 Admin Login
- **Method & Path**: `POST /api/v1/auth/login`
- **Description**: Authenticates administrator credentials and returns an HTTP Bearer JWT token.
- **Request Body**:
  ```json
  {
    "email": "admin@doctortracker.com",
    "password": "SecurePassword#2026",
    "rememberMe": true
  }
  ```
- **Validation Rules**:
  - `email`: Required, valid email format.
  - `password`: Required, minimum 6 characters.
  - `rememberMe`: Optional boolean.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "User authenticated successfully",
    "data": {
      "user": {
        "id": "admin-1",
        "email": "admin@doctortracker.com",
        "name": "Admin User",
        "role": "admin"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    "meta": null
  }
  ```
- **Error Response (`401 Unauthorized`)**:
  ```json
  {
    "success": false,
    "message": "Invalid email or password combination",
    "errors": null
  }
  ```

### 3.2 Current Admin Profile
- **Method & Path**: `GET /api/v1/auth/profile`
- **Headers**: `Authorization: Bearer <token>`
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Profile retrieved successfully",
    "data": {
      "id": "admin-1",
      "email": "admin@doctortracker.com",
      "name": "Admin User",
      "role": "admin"
    },
    "meta": null
  }
  ```

---

## 4. Doctor Management API Contracts

### 4.1 Get Paginated Doctors List
- **Method & Path**: `GET /api/v1/doctors`
- **Query Parameters**:
  - Standard pagination (`page`, `limit`, `search`, `startDate`, `endDate`)
  - `specialty` (`string`): e.g., `"Cardiology"`, `"Neurology"`
  - `status` (`string`): `"Active"`, `"Available"`, `"On Leave"`, `"At Capacity"`
  - `shift` (`string`): `"Morning"`, `"Evening"`, `"Night"`
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Doctors fetched successfully",
    "data": [
      {
        "id": "doc-1",
        "code": "#DOC-1042",
        "name": "Dr. Marcus Vance",
        "specialization": "Cardiology",
        "hospital": "Central City Hospital",
        "phone": "+1 (555) 234-8910",
        "email": "marcus.vance@doctortracker.com",
        "status": "Active",
        "shift": "Morning",
        "patientCount": 32,
        "maxCapacity": 35,
        "createdAt": "2026-09-15T08:00:00Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 148,
      "totalPages": 15
    }
  }
  ```

### 4.2 Get Doctor By ID
- **Method & Path**: `GET /api/v1/doctors/:id`
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Doctor retrieved successfully",
    "data": {
      "id": "doc-1",
      "code": "#DOC-1042",
      "name": "Dr. Marcus Vance",
      "specialization": "Cardiology",
      "hospital": "Central City Hospital",
      "phone": "+1 (555) 234-8910",
      "email": "marcus.vance@doctortracker.com",
      "status": "Active",
      "shift": "Morning",
      "patientCount": 32,
      "maxCapacity": 35,
      "createdAt": "2026-09-15T08:00:00Z"
    },
    "meta": null
  }
  ```
- **Error Response (`404 Not Found`)**:
  ```json
  {
    "success": false,
    "message": "Doctor not found",
    "errors": null
  }
  ```

### 4.3 Create Doctor
- **Method & Path**: `POST /api/v1/doctors`
- **Request Body**:
  ```json
  {
    "name": "Dr. Marcus Vance",
    "specialization": "Cardiology",
    "hospital": "Central City Hospital",
    "phone": "+1 (555) 234-8910",
    "email": "marcus.vance@doctortracker.com",
    "status": "Active",
    "shift": "Morning",
    "maxCapacity": 35
  }
  ```
- **Field Requirements**:
  - `name`: Required, 2–100 characters.
  - `specialization`: Required, minimum 2 characters.
  - `hospital`: Required, minimum 2 characters.
  - `phone`: Required, valid phone number format.
  - `email`: Required, valid email format.
  - `status`: Optional, defaults to `"Active"`.
  - `shift`: Optional (`"Morning"`, `"Evening"`, `"Night"`).
- **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Doctor created successfully",
    "data": {
      "id": "doc-1042",
      "name": "Dr. Marcus Vance",
      "specialization": "Cardiology",
      "hospital": "Central City Hospital",
      "phone": "+1 (555) 234-8910",
      "email": "marcus.vance@doctortracker.com",
      "status": "Active",
      "patientCount": 0,
      "createdAt": "2026-11-04T14:20:00.000Z"
    },
    "meta": null
  }
  ```

### 4.4 Update Doctor
- **Method & Path**: `PUT /api/v1/doctors/:id`
- **Request Body**: Partial or full doctor fields.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Doctor updated successfully",
    "data": {
      "id": "doc-1",
      "name": "Dr. Marcus Vance",
      "specialization": "Cardiology",
      "hospital": "Central City Hospital",
      "phone": "+1 (555) 234-8910",
      "email": "marcus.vance@doctortracker.com",
      "status": "Active"
    },
    "meta": null
  }
  ```

### 4.5 Delete Doctor
- **Method & Path**: `DELETE /api/v1/doctors/:id`
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Doctor deleted successfully",
    "data": {},
    "meta": null
  }
  ```

### 4.6 Get Patients of a Doctor
- **Method & Path**: `GET /api/v1/doctors/:id/patients`
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Doctor patients retrieved successfully",
    "data": [
      {
        "id": "pt-1",
        "name": "Elena Rostova",
        "condition": "Critical",
        "assignedDate": "Oct 14, 2026",
        "phone": "+1 (555) 111-2233",
        "notes": "Follow-up scheduled"
      }
    ],
    "meta": null
  }
  ```

### 4.7 Add Patient Under Doctor
- **Method & Path**: `POST /api/v1/doctors/:id/patients`
- **Request Body**:
  ```json
  {
    "name": "Elena Rostova",
    "condition": "Critical",
    "phone": "+1 (555) 111-2233",
    "notes": "Follow-up scheduled"
  }
  ```
- **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Patient added to doctor successfully",
    "data": {
      "id": "pt-1",
      "name": "Elena Rostova",
      "condition": "Critical",
      "assignedDate": "2026-11-04",
      "phone": "+1 (555) 111-2233",
      "notes": "Follow-up scheduled"
    },
    "meta": null
  }
  ```

### 4.8 Delete Patient from Doctor
- **Method & Path**: `DELETE /api/v1/doctors/:id/patients/:patientId`
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Patient removed from doctor successfully",
    "data": {},
    "meta": null
  }
  ```

---

## 5. Patient Management API Contracts

### 5.1 Get Paginated Patients List
- **Method & Path**: `GET /api/v1/patients`
- **Query Parameters**:
  - Standard pagination (`page`, `limit`, `search`, `startDate`, `endDate`)
  - `condition` (`string`): `"Critical"`, `"Under Treatment"`, `"Stable"`, `"Recovering"`, or `"Unassigned"`
  - `status` (`string`): `"Active"`, `"Inactive"`, `"Archived"`
  - `doctorId` (`string`): Filter patients assigned to a specific doctor
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Patients fetched successfully",
    "data": [
      {
        "id": "pt-1",
        "code": "#MRN-8492",
        "name": "Elena Rostova",
        "phone": "+1 (555) 111-2233",
        "age": 42,
        "gender": "Female",
        "condition": "Critical",
        "status": "Active",
        "roomNumber": "ICU-04",
        "assignedDoctorId": "doc-1",
        "assignedDoctor": {
          "id": "doc-1",
          "name": "Dr. Marcus Vance",
          "specialization": "Cardiology"
        },
        "createdAt": "2026-10-14T08:30:00Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 248,
      "totalPages": 25
    }
  }
  ```

### 5.2 Get Patient By ID
- **Method & Path**: `GET /api/v1/patients/:id`
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Patient retrieved successfully",
    "data": {
      "id": "pt-1",
      "code": "#MRN-8492",
      "name": "Elena Rostova",
      "phone": "+1 (555) 111-2233",
      "age": 42,
      "gender": "Female",
      "condition": "Critical",
      "status": "Active",
      "roomNumber": "ICU-04",
      "assignedDoctorId": "doc-1",
      "assignedDoctor": {
        "id": "doc-1",
        "name": "Dr. Marcus Vance",
        "specialization": "Cardiology"
      },
      "createdAt": "2026-10-14T08:30:00Z"
    },
    "meta": null
  }
  ```

### 5.3 Create Patient
- **Method & Path**: `POST /api/v1/patients`
- **Request Body**:
  ```json
  {
    "name": "Elena Rostova",
    "phone": "+1 (555) 111-2233",
    "condition": "Critical",
    "status": "Active",
    "assignedDoctorId": "doc-1",
    "age": 42,
    "gender": "Female",
    "roomNumber": "ICU-04"
  }
  ```
- **Validation Rules**:
  - `name`: Required, 2–100 characters.
  - `phone`: Required, valid contact format.
  - `condition`: Required, one of `["Critical", "Under Treatment", "Stable", "Recovering"]`.
  - `status`: Required, one of `["Active", "Inactive", "Archived"]`.
  - `assignedDoctorId`: Optional or null.
- **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Patient created successfully",
    "data": {
      "id": "pt-8492",
      "name": "Elena Rostova",
      "phone": "+1 (555) 111-2233",
      "condition": "Critical",
      "status": "Active",
      "assignedDoctorId": "doc-1",
      "createdAt": "2026-11-04T14:20:00.000Z"
    },
    "meta": null
  }
  ```

### 5.4 Update Patient
- **Method & Path**: `PUT /api/v1/patients/:id`
- **Request Body**: Partial or full patient fields.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Patient updated successfully",
    "data": {
      "id": "pt-1",
      "name": "Elena Rostova",
      "condition": "Stable",
      "status": "Active"
    },
    "meta": null
  }
  ```

### 5.5 Delete Patient
- **Method & Path**: `DELETE /api/v1/patients/:id`
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Patient deleted successfully",
    "data": {},
    "meta": null
  }
  ```

---

## 6. Dashboard Analytics API Contract

### 6.1 Get Dashboard Aggregated Analytics
- **Method & Path**: `GET /api/v1/analytics/dashboard`
- **Query Parameters**:
  - `period` (`string`, optional): `"7d"`, `"30d"` (default), or `"90d"`.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Dashboard analytics retrieved successfully",
    "data": {
      "metrics": {
        "totalDoctors": 148,
        "totalPatients": 3842,
        "patientsPerDoctor": 25.9,
        "assignedPatients": 3718,
        "unassignedPatients": 124
      },
      "trends": [
        { "date": "Oct 01", "count": 85 },
        { "date": "Oct 06", "count": 112 },
        { "date": "Oct 11", "count": 98 },
        { "date": "Oct 16", "count": 142 },
        { "date": "Oct 21", "count": 130 },
        { "date": "Oct 26", "count": 165 },
        { "date": "Oct 31", "count": 184 },
        { "date": "Nov 04", "count": 210 }
      ],
      "workload": [
        { "id": "doc-1", "name": "Dr. Marcus Vance", "specialty": "Cardiology", "patientCount": 32 },
        { "id": "doc-2", "name": "Dr. Priya Patel", "specialty": "Neurology", "patientCount": 28 },
        { "id": "doc-3", "name": "Dr. Aris Thorne", "specialty": "Oncology", "patientCount": 26 }
      ],
      "conditions": [
        { "condition": "Stable", "count": 1614, "percentage": 42 },
        { "condition": "Under Treatment", "count": 1191, "percentage": 31 },
        { "condition": "Recovering", "count": 692, "percentage": 18 },
        { "condition": "Critical", "count": 345, "percentage": 9 }
      ],
      "recentPatients": [
        {
          "id": "pt-1",
          "name": "Elena Rostova",
          "registeredDate": "Today, 10:45 AM",
          "condition": "Critical",
          "assignedDoctor": {
            "id": "doc-1",
            "name": "Dr. Marcus Vance",
            "specialty": "Cardiology"
          }
        }
      ]
    },
    "meta": null
  }
  ```

---

## 7. Validation Error Contract Format

When request payload validation fails, the API returns HTTP 400 with field-level breakdowns:

```json
{
  "success": false,
  "message": "Validation failed on submitted request",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address format"
    },
    {
      "field": "phone",
      "message": "Valid contact phone number is required"
    }
  ]
}
```

