import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Admin } from '../src/models/admin.model.js';
import { Doctor } from '../src/models/doctor.model.js';
import { Patient } from '../src/models/patient.model.js';
import { hashPassword } from '../src/utils/password.util.js';

/**
 * Isolated Synthetic E2E Test Data Seeder
 * Run with: pnpm seed:e2e
 * Target database: STRICTLY doctor_tracker_e2e
 */

const E2E_DB_NAME = 'doctor_tracker_e2e';

// 1. Doctors Dataset (6 Doctors with diverse specialties, hospital affiliations, and zero unsupported fields)
const DOCTOR_DATA = [
  {
    name: 'Gregory House',
    specialization: 'Diagnostic Medicine',
    hospital: 'Princeton-Plainsboro Teaching Hospital',
    phone: '+1-555-0101',
    email: 'gregory.house@clinical.test.invalid',
  },
  {
    name: 'Allison Cameron',
    specialization: 'Immunology',
    hospital: 'Princeton-Plainsboro Teaching Hospital',
    phone: '+1-555-0102',
    email: 'allison.cameron@clinical.test.invalid',
  },
  {
    name: 'James Wilson',
    specialization: 'Oncology',
    hospital: 'Mercy General Hospital',
    phone: '+1-555-0103',
    email: 'james.wilson@clinical.test.invalid',
  },
  {
    name: 'Robert Chase',
    specialization: 'Intensive Care Medicine',
    hospital: 'St. Jude Medical Center',
    phone: '+1-555-0104',
    email: 'robert.chase@clinical.test.invalid',
  },
  {
    name: 'Lisa Cuddy',
    specialization: 'Endocrinology',
    hospital: 'MetroHealth Medical Center',
    phone: '+1-555-0105',
    email: 'lisa.cuddy@clinical.test.invalid',
  },
  {
    name: 'Eric Foreman',
    specialization: 'Neurology',
    hospital: 'University Heights Hospital',
    phone: '+1-555-0106',
    email: 'eric.foreman@clinical.test.invalid',
  },
];

// 2. Patient Templates (30 Patients: 25 assigned across doctors with variable distributions, 5 unassigned)
// Distribution requirement:
// - At least one Doctor has several patients (e.g., House has 12)
// - At least one Doctor has a moderate number (e.g., Cameron has 6, Wilson has 4, Chase has 2)
// - At least one Doctor has only one Patient (e.g., Cuddy has 1)
// - At least one Doctor has zero Patients (e.g., Foreman has 0)
// - Five Patients remain unassigned (null assignedDoctorId)
const PATIENT_TEMPLATES = [
  // --- Doctor 0 (House - 12 Patients) ---
  { name: 'Arthur Dent', condition: 'Lupus Erythematosus', age: 42, gender: 'male', phone: '+1-555-0201', docIdx: 0, daysAgo: 25 },
  { name: 'Tricia McMillan', condition: 'Cardiomyopathy', age: 36, gender: 'female', phone: '+1-555-0202', docIdx: 0, daysAgo: 24 },
  { name: 'Ford Prefect', condition: 'Addison Disease', age: 40, gender: 'other', phone: '+1-555-0203', docIdx: 0, daysAgo: 22 },
  { name: 'Zaphod Beeblebrox', condition: 'Arrhythmia', age: 45, gender: 'male', phone: '+1-555-0204', docIdx: 0, daysAgo: 20 },
  { name: 'Marvin Android', condition: 'Chronic Fatigue', age: 60, gender: 'prefer_not_to_say', phone: undefined, docIdx: 0, daysAgo: 19 },
  { name: 'Slartibartfast Magrathea', condition: 'Osteoarthritis', age: 72, gender: 'male', phone: '+1-555-0206', docIdx: 0, daysAgo: 18 },
  { name: 'Dirk Gently', condition: 'Under Treatment', age: 39, gender: 'male', phone: '+1-555-0207', docIdx: 0, daysAgo: 16 },
  { name: 'Richard MacDuff', condition: 'Hypertension', age: 31, gender: 'male', phone: '+1-555-0208', docIdx: 0, daysAgo: 15 },
  { name: 'Susan Way', condition: 'Celiac Disease', age: 29, gender: 'female', phone: undefined, docIdx: 0, daysAgo: 14 },
  { name: 'Reg Chronotis', condition: 'Temporal Arteritis', age: 85, gender: 'male', phone: '+1-555-0210', docIdx: 0, daysAgo: 12 },
  { name: 'Michael Wenton-Weakes', condition: 'Anemia', age: 33, gender: 'male', phone: '+1-555-0211', docIdx: 0, daysAgo: 10 },
  { name: 'Elena Ross', condition: 'Under Treatment', age: 27, gender: 'female', phone: '+1-555-0212', docIdx: 0, daysAgo: 8 },

  // --- Doctor 1 (Cameron - 6 Patients) ---
  { name: 'Samuel Vimes', condition: 'Hypertension', age: 52, gender: 'male', phone: '+1-555-0213', docIdx: 1, daysAgo: 21 },
  { name: 'Sybil Ramkin', condition: 'Asthma', age: 48, gender: 'female', phone: '+1-555-0214', docIdx: 1, daysAgo: 17 },
  { name: 'Carrot Ironfoundersson', condition: 'Under Treatment', age: 26, gender: 'male', phone: '+1-555-0215', docIdx: 1, daysAgo: 15 },
  { name: 'Angua von Uberwald', condition: 'Allergic Rhinitis', age: 28, gender: 'female', phone: '+1-555-0216', docIdx: 1, daysAgo: 11 },
  { name: 'Cheery Littlebottom', condition: 'Metabolic Syndrome', age: 34, gender: 'female', phone: undefined, docIdx: 1, daysAgo: 9 },
  { name: 'Fred Colon', condition: 'Gout', age: 58, gender: 'male', phone: '+1-555-0218', docIdx: 1, daysAgo: 5 },

  // --- Doctor 2 (Wilson - 4 Patients) ---
  { name: 'Moist von Lipwig', condition: 'Melanoma (Stage 1)', age: 35, gender: 'male', phone: '+1-555-0219', docIdx: 2, daysAgo: 23 },
  { name: 'Adora Belle Dearheart', condition: 'Hypothyroidism', age: 32, gender: 'female', phone: '+1-555-0220', docIdx: 2, daysAgo: 16 },
  { name: 'Lord Vetinari', condition: 'Under Treatment', age: 59, gender: 'male', phone: '+1-555-0221', docIdx: 2, daysAgo: 13 },
  { name: 'Drumknott Archive', condition: 'Carpal Tunnel Syndrome', age: 41, gender: 'male', phone: undefined, docIdx: 2, daysAgo: 7 },

  // --- Doctor 3 (Chase - 2 Patients) ---
  { name: 'Esmerelda Weatherwax', condition: 'Acute Bronchitis', age: 68, gender: 'female', phone: '+1-555-0223', docIdx: 3, daysAgo: 12 },
  { name: 'Gytha Ogg', condition: 'Under Treatment', age: 65, gender: 'female', phone: '+1-555-0224', docIdx: 3, daysAgo: 6 },

  // --- Doctor 4 (Cuddy - 1 Patient) ---
  { name: 'Tiffany Aching', condition: 'Type 1 Diabetes', age: 19, gender: 'female', phone: '+1-555-0225', docIdx: 4, daysAgo: 4 },

  // --- Doctor 5 (Foreman - 0 Patients) -> intentionally 0 patients!

  // --- Unassigned Patients (5 Patients, docIdx: null) ---
  { name: 'Miles Vorkosigan', condition: 'Brittle Bone Syndrome', age: 30, gender: 'male', phone: '+1-555-0226', docIdx: null, daysAgo: 15 },
  { name: 'Cordelia Naismith', condition: 'Under Treatment', age: 46, gender: 'female', phone: '+1-555-0227', docIdx: null, daysAgo: 11 },
  { name: 'Gregor Vorbarra', condition: 'Chronic Insomnia', age: 38, gender: 'male', phone: '+1-555-0228', docIdx: null, daysAgo: 7 },
  { name: 'Ekaterin Vorsoisson', condition: 'Allergies', age: 34, gender: 'female', phone: undefined, docIdx: null, daysAgo: 3 },
  { name: 'Mark Pierre Vorkosigan', condition: 'Hypoglycemia', age: 29, gender: 'male', phone: '+1-555-0230', docIdx: null, daysAgo: 1 },
];

export async function seedE2EDatabase(overrideUri?: string): Promise<{
  doctorsCount: number;
  patientsCount: number;
  assignedCount: number;
  unassignedCount: number;
  adminCreated: boolean;
}> {
  const baseUri = overrideUri || process.env.MONGODB_URI || 'mongodb://localhost:27017/doctor_tracker';

  // Parse base URL using standard URL or string replacement preserving credentials and search params
  const parsed = new URL(baseUri);
  parsed.pathname = `/${E2E_DB_NAME}`;
  const e2eUri = parsed.toString();

  console.log(`[E2E Seed] Target database verification: ${E2E_DB_NAME}`);

  // SAFETY CHECK: Ensure we NEVER touch standard development DB
  if (!e2eUri.includes(E2E_DB_NAME)) {
    throw new Error(`FATAL SAFETY ERROR: Connection URI does not point to isolated E2E database ${E2E_DB_NAME}`);
  }

  await mongoose.connect(e2eUri);

  const connectedDbName = mongoose.connection.db?.databaseName;
  if (connectedDbName !== E2E_DB_NAME) {
    await mongoose.disconnect();
    throw new Error(`FATAL SAFETY ERROR: Connected to unexpected database "${connectedDbName}". Expected "${E2E_DB_NAME}".`);
  }

  console.log(`[E2E Seed] Confirmed connection to isolated test database: "${connectedDbName}"`);

  // Clear existing E2E data idempotently
  await Promise.all([
    Admin.deleteMany({ email: /@doctortracker\.test\.invalid$/ }),
    Doctor.deleteMany({ email: /@clinical\.test\.invalid$/ }),
    Patient.deleteMany({ name: { $in: PATIENT_TEMPLATES.map((p) => p.name) } }),
  ]);

  // 1. Seed dedicated E2E Admin Account
  const testAdminEmail = 'e2e.admin@doctortracker.test.invalid';
  let adminCreated = false;
  const existingAdmin = await Admin.findOne({ email: testAdminEmail });
  if (!existingAdmin) {
    const passwordHash = await hashPassword('AdminPassword#2026');
    await Admin.create({
      name: 'E2E Test Administrator',
      email: testAdminEmail,
      passwordHash,
    });
    adminCreated = true;
    console.log(`[E2E Seed] Created dedicated E2E admin account: ${testAdminEmail}`);
  } else {
    console.log(`[E2E Seed] E2E admin account already exists.`);
  }

  // 2. Seed Doctors
  const insertedDoctors = await Doctor.insertMany(DOCTOR_DATA);
  console.log(`[E2E Seed] Seeded ${insertedDoctors.length} synthetic doctors.`);

  // 3. Seed Patients with verified references
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const patientDocs = PATIENT_TEMPLATES.map((tmpl) => {
    const assignedDoctorId = tmpl.docIdx !== null ? insertedDoctors[tmpl.docIdx]._id : null;
    const createdAt = new Date(now - tmpl.daysAgo * dayMs);
    const updatedAt = createdAt;

    return {
      name: tmpl.name,
      condition: tmpl.condition,
      assignedDoctorId,
      age: tmpl.age,
      gender: tmpl.gender as 'male' | 'female' | 'other' | 'prefer_not_to_say',
      phone: tmpl.phone,
      createdAt,
      updatedAt,
    };
  });

  const insertedPatients = await Patient.insertMany(patientDocs);
  console.log(`[E2E Seed] Seeded ${insertedPatients.length} synthetic patients.`);

  const assignedCount = insertedPatients.filter((p) => p.assignedDoctorId !== null).length;
  const unassignedCount = insertedPatients.filter((p) => p.assignedDoctorId === null).length;

  console.log(`[E2E Seed] Breakdown: ${assignedCount} assigned, ${unassignedCount} unassigned.`);
  console.log(`[E2E Seed] Doctor distributions:`);
  for (let i = 0; i < insertedDoctors.length; i++) {
    const count = insertedPatients.filter(
      (p) => p.assignedDoctorId?.toString() === insertedDoctors[i]._id.toString()
    ).length;
    console.log(`   - Dr. ${insertedDoctors[i].name} (${insertedDoctors[i].specialization}): ${count} patients`);
  }

  await mongoose.disconnect();
  console.log('[E2E Seed] Finished successfully and disconnected.');

  return {
    doctorsCount: insertedDoctors.length,
    patientsCount: insertedPatients.length,
    assignedCount,
    unassignedCount,
    adminCreated,
  };
}

// Direct CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  seedE2EDatabase()
    .then((result) => {
      console.log('[E2E Seed] Completed successfully:', result);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[E2E Seed] Failed:', err);
      process.exit(1);
    });
}
