import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import {
  connectTestDb,
  clearTestDb,
  disconnectTestDb,
  createTestAdmin,
} from './helpers/test-db.js';
import { Doctor } from '../src/models/doctor.model.js';
import { Patient } from '../src/models/patient.model.js';

describe('Phase 07, 08 & 10: Patient CRUD, Search & Integrity Test Suite', () => {
  let authCookie: string;
  let sampleDoctor: InstanceType<typeof Doctor>;

  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    const { cookie } = await createTestAdmin();
    authCookie = cookie;

    sampleDoctor = await Doctor.create({
      name: 'Dr. Gregory House',
      specialization: 'Nephrology',
      hospital: 'Princeton-Plainsboro',
      phone: '+1-555-0199',
      email: 'house@princeton.edu',
    });
  });

  it('should block unauthenticated access to Patient endpoints with 401', async () => {
    const res = await request(app).get('/api/v1/patients');
    expect(res.status).toBe(401);
  });

  it('should create a Patient with valid required fields including age and gender', async () => {
    const patientData = {
      name: 'Jane Doe',
      condition: 'Hypertension',
      assignedDoctorId: sampleDoctor._id.toString(),
      age: 35,
      gender: 'female',
      phone: '+1-555-9876',
    };

    const res = await request(app)
      .post('/api/v1/patients')
      .set('Cookie', authCookie)
      .send(patientData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Jane Doe');
    expect(res.body.data.age).toBe(35);
    expect(res.body.data.gender).toBe('female');
    expect(res.body.data.assignedDoctorId).toBe(sampleDoctor._id.toString());
  });

  it('should reject Patient creation if assigned doctor does not exist (400)', async () => {
    const nonExistentDocId = new mongoose.Types.ObjectId().toString();

    const res = await request(app).post('/api/v1/patients').set('Cookie', authCookie).send({
      name: 'Orphan Patient',
      condition: 'Fever',
      assignedDoctorId: nonExistentDocId,
      age: 20,
      gender: 'male',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('does not exist');
  });

  it('should reject invalid age and gender values with 422', async () => {
    const badAgeRes = await request(app).post('/api/v1/patients').set('Cookie', authCookie).send({
      name: 'Bad Age',
      condition: 'Cold',
      assignedDoctorId: sampleDoctor._id.toString(),
      age: 150, // max 120
      gender: 'male',
    });
    expect(badAgeRes.status).toBe(422);

    const badGenderRes = await request(app)
      .post('/api/v1/patients')
      .set('Cookie', authCookie)
      .send({
        name: 'Bad Gender',
        condition: 'Cold',
        assignedDoctorId: sampleDoctor._id.toString(),
        age: 25,
        gender: 'unsupported_gender',
      });
    expect(badGenderRes.status).toBe(422);
  });

  it('should retrieve a patient by ID and return 404 for non-existent ID', async () => {
    const patient = await Patient.create({
      name: 'John Smith',
      condition: 'Asthma',
      assignedDoctorId: sampleDoctor._id,
      age: 45,
      gender: 'male',
    });

    const getRes = await request(app)
      .get(`/api/v1/patients/${patient._id}`)
      .set('Cookie', authCookie);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.name).toBe('John Smith');

    const notFoundRes = await request(app)
      .get(`/api/v1/patients/${new mongoose.Types.ObjectId()}`)
      .set('Cookie', authCookie);
    expect(notFoundRes.status).toBe(404);
  });

  it('should partially update a patient and validate doctor if reassigned', async () => {
    const patient = await Patient.create({
      name: 'Mark Johnson',
      condition: 'Diabetes',
      assignedDoctorId: sampleDoctor._id,
      age: 50,
      gender: 'male',
    });

    // Reassigning to non-existent doctor fails with 400
    const badReassignRes = await request(app)
      .patch(`/api/v1/patients/${patient._id}`)
      .set('Cookie', authCookie)
      .send({ assignedDoctorId: new mongoose.Types.ObjectId().toString() });
    expect(badReassignRes.status).toBe(400);

    // Valid partial update
    const updateRes = await request(app)
      .patch(`/api/v1/patients/${patient._id}`)
      .set('Cookie', authCookie)
      .send({ condition: 'Controlled Diabetes', age: 51 });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.condition).toBe('Controlled Diabetes');
    expect(updateRes.body.data.age).toBe(51);
    expect(updateRes.body.data.name).toBe('Mark Johnson');
  });

  it('should delete a patient without modifying or deleting the assigned doctor', async () => {
    const patient = await Patient.create({
      name: 'Temporary Patient',
      condition: 'Mild Flu',
      assignedDoctorId: sampleDoctor._id,
      age: 22,
      gender: 'other',
    });

    const deleteRes = await request(app)
      .delete(`/api/v1/patients/${patient._id}`)
      .set('Cookie', authCookie);

    expect(deleteRes.status).toBe(200);

    // Patient is deleted
    const patientInDb = await Patient.findById(patient._id);
    expect(patientInDb).toBeNull();

    // Doctor is untouched
    const doctorInDb = await Doctor.findById(sampleDoctor._id);
    expect(doctorInDb).not.toBeNull();
  });

  it('should support search, exact condition filter, and date ranges with pagination', async () => {
    const baseDate = new Date('2026-05-01T10:00:00.000Z');
    const patients = [];
    const conditions = ['Hypertension', 'Diabetes', 'Asthma'];
    for (let i = 1; i <= 15; i++) {
      patients.push({
        name: `Patient_${i.toString().padStart(2, '0')} Smith`,
        condition: conditions[i % conditions.length]!,
        assignedDoctorId: sampleDoctor._id,
        age: 20 + i,
        gender: i % 2 === 0 ? 'female' : 'male',
        phone: `+1-555-88${i.toString().padStart(2, '0')}`,
        createdAt: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000),
      });
    }
    await Patient.insertMany(patients);

    // Pagination
    const listRes = await request(app)
      .get('/api/v1/patients?page=1&limit=10')
      .set('Cookie', authCookie);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(10);
    expect(listRes.body.meta.total).toBe(15);

    // Condition filter
    const condRes = await request(app)
      .get('/api/v1/patients?condition=Hypertension')
      .set('Cookie', authCookie);
    expect(condRes.status).toBe(200);
    expect(condRes.body.meta.total).toBe(5);

    // Regex metacharacter escaping
    const regexRes = await request(app).get('/api/v1/patients?search=.*').set('Cookie', authCookie);
    expect(regexRes.status).toBe(200);
    expect(regexRes.body.data.length).toBe(0);
  });

  it('should create an unassigned patient when assignedDoctorId is null or omitted', async () => {
    // 1. Omitted assignedDoctorId
    const res1 = await request(app).post('/api/v1/patients').set('Cookie', authCookie).send({
      name: 'Unassigned Patient One',
      condition: 'Under Treatment',
      age: 28,
      gender: 'male',
      phone: '+1-555-0991',
    });

    expect(res1.status).toBe(201);
    expect(res1.body.data.assignedDoctorId).toBeNull();
    expect(res1.body.data.name).toBe('Unassigned Patient One');

    // 2. Explicit null assignedDoctorId
    const res2 = await request(app).post('/api/v1/patients').set('Cookie', authCookie).send({
      name: 'Unassigned Patient Two',
      condition: 'Stable',
      age: 44,
      gender: 'female',
      phone: '+1-555-0992',
      assignedDoctorId: null,
    });

    expect(res2.status).toBe(201);
    expect(res2.body.data.assignedDoctorId).toBeNull();
  });

  it('should assign, reassign, and unassign a doctor via PATCH', async () => {
    // Create another doctor
    const secondDoctor = await Doctor.create({
      name: 'Dr. James Wilson',
      specialization: 'Oncology',
      hospital: 'Princeton-Plainsboro',
      phone: '+1-555-0188',
      email: 'wilson@princeton.edu',
    });

    // 1. Create unassigned patient
    const created = await Patient.create({
      name: 'Floating Patient',
      condition: 'Observation',
      age: 30,
      gender: 'other',
      assignedDoctorId: null,
    });

    // 2. Assign first doctor
    const assignRes = await request(app)
      .patch(`/api/v1/patients/${created._id}`)
      .set('Cookie', authCookie)
      .send({ assignedDoctorId: sampleDoctor._id.toString() });

    expect(assignRes.status).toBe(200);
    const docObj1 = assignRes.body.data.assignedDoctorId;
    const docId1 = typeof docObj1 === 'object' ? docObj1._id : docObj1;
    expect(docId1.toString()).toBe(sampleDoctor._id.toString());

    // 3. Reassign to second doctor
    const reassignRes = await request(app)
      .patch(`/api/v1/patients/${created._id}`)
      .set('Cookie', authCookie)
      .send({ assignedDoctorId: secondDoctor._id.toString() });

    expect(reassignRes.status).toBe(200);
    const docObj2 = reassignRes.body.data.assignedDoctorId;
    const docId2 = typeof docObj2 === 'object' ? docObj2._id : docObj2;
    expect(docId2.toString()).toBe(secondDoctor._id.toString());

    // 4. Unassign (set to null)
    const unassignRes = await request(app)
      .patch(`/api/v1/patients/${created._id}`)
      .set('Cookie', authCookie)
      .send({ assignedDoctorId: null });

    expect(unassignRes.status).toBe(200);
    expect(unassignRes.body.data.assignedDoctorId).toBeNull();
  });

  it('should filter patients by doctorId or unassigned', async () => {
    const unassignedPatient = await Patient.create({
      name: 'Solo Patient',
      condition: 'Checkup',
      age: 25,
      gender: 'female',
      assignedDoctorId: null,
    });

    const assignedPatient = await Patient.create({
      name: 'House Patient',
      condition: 'Lupus',
      age: 40,
      gender: 'male',
      assignedDoctorId: sampleDoctor._id,
    });

    // Query patients for sampleDoctor
    const docFilterRes = await request(app)
      .get(`/api/v1/patients?doctorId=${sampleDoctor._id}`)
      .set('Cookie', authCookie);

    expect(docFilterRes.status).toBe(200);
    expect(docFilterRes.body.data.length).toBe(1);
    expect(docFilterRes.body.data[0]._id.toString()).toBe(assignedPatient._id.toString());

    // Query unassigned patients
    const unassignedRes = await request(app)
      .get('/api/v1/patients?doctorId=unassigned')
      .set('Cookie', authCookie);

    expect(unassignedRes.status).toBe(200);
    expect(unassignedRes.body.data.length).toBe(1);
    expect(unassignedRes.body.data[0]._id.toString()).toBe(unassignedPatient._id.toString());
  });

  it('should verify previously unassigned patients do not appear under a newly created doctor', async () => {
    await Patient.create({
      name: 'Orphan Patient',
      condition: 'Stable',
      age: 50,
      gender: 'other',
      assignedDoctorId: null,
    });

    // Create new doctor
    const newDoc = await Doctor.create({
      name: 'Dr. Allison Cameron',
      specialization: 'Immunology',
      hospital: 'Princeton-Plainsboro',
      phone: '+1-555-0177',
      email: 'cameron@princeton.edu',
    });

    // Query doctor's patients
    const res = await request(app)
      .get(`/api/v1/patients?doctorId=${newDoc._id}`)
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
    expect(res.body.meta.total).toBe(0);
  });

  describe('Global Patient Statistics — GET /api/v1/patients/stats', () => {
    it('should reject unauthenticated requests to /api/v1/patients/stats with 401', async () => {
      const res = await request(app).get('/api/v1/patients/stats');
      expect(res.status).toBe(401);
    });

    it('should safely handle an empty database returning zero for all statistics', async () => {
      const res = await request(app).get('/api/v1/patients/stats').set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({
        totalPatients: 0,
        criticalPatients: 0,
        underTreatmentPatients: 0,
        unassignedPatients: 0,
        criticalCare: 0,
        underTreatment: 0,
        unassigned: 0,
        stable: 0,
        recovering: 0,
      });
    });

    it('should accurately aggregate global statistics across the entire Patient collection', async () => {
      // 1. Critical + Assigned
      await Patient.create({
        name: 'Patient 1',
        condition: 'Critical',
        age: 45,
        gender: 'female',
        assignedDoctorId: sampleDoctor._id,
      });

      // 2. Critical + Unassigned
      await Patient.create({
        name: 'Patient 2',
        condition: 'Critical',
        age: 60,
        gender: 'male',
        assignedDoctorId: null,
      });

      // 3. Under Treatment + Assigned
      await Patient.create({
        name: 'Patient 3',
        condition: 'Under Treatment',
        age: 30,
        gender: 'male',
        assignedDoctorId: sampleDoctor._id,
      });

      // 4. Under Treatment + Unassigned
      await Patient.create({
        name: 'Patient 4',
        condition: 'Under Treatment',
        age: 28,
        gender: 'female',
        assignedDoctorId: null,
      });

      // 5. Stable + Unassigned
      await Patient.create({
        name: 'Patient 5',
        condition: 'Stable',
        age: 50,
        gender: 'other',
        assignedDoctorId: null,
      });

      // 6. Recovering + Assigned
      await Patient.create({
        name: 'Patient 6',
        condition: 'Recovering',
        age: 22,
        gender: 'female',
        assignedDoctorId: sampleDoctor._id,
      });

      const res = await request(app).get('/api/v1/patients/stats').set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalPatients).toBe(6);
      expect(res.body.data.criticalPatients).toBe(2);
      expect(res.body.data.underTreatmentPatients).toBe(2);
      expect(res.body.data.unassignedPatients).toBe(3); // Patient 2, 4, 5

      // Aliases
      expect(res.body.data.criticalCare).toBe(2);
      expect(res.body.data.underTreatment).toBe(2);
      expect(res.body.data.unassigned).toBe(3);
      expect(res.body.data.stable).toBe(1);
      expect(res.body.data.recovering).toBe(1);
    });

    it('should reflect changes when creating, assigning, or deleting patients', async () => {
      // Create unassigned Under Treatment patient
      const p1 = await Patient.create({
        name: 'Dynamic Patient',
        condition: 'Under Treatment',
        age: 33,
        gender: 'male',
        assignedDoctorId: null,
      });

      let statsRes = await request(app).get('/api/v1/patients/stats').set('Cookie', authCookie);
      expect(statsRes.body.data.totalPatients).toBe(1);
      expect(statsRes.body.data.underTreatmentPatients).toBe(1);
      expect(statsRes.body.data.unassignedPatients).toBe(1);
      expect(statsRes.body.data.criticalPatients).toBe(0);

      // Create Critical patient
      const p2 = await Patient.create({
        name: 'Critical Patient',
        condition: 'Critical',
        age: 55,
        gender: 'female',
        assignedDoctorId: sampleDoctor._id,
      });

      statsRes = await request(app).get('/api/v1/patients/stats').set('Cookie', authCookie);
      expect(statsRes.body.data.totalPatients).toBe(2);
      expect(statsRes.body.data.criticalPatients).toBe(1);
      expect(statsRes.body.data.unassignedPatients).toBe(1);

      // Assign doctor to p1
      await Patient.findByIdAndUpdate(p1._id, { assignedDoctorId: sampleDoctor._id });
      statsRes = await request(app).get('/api/v1/patients/stats').set('Cookie', authCookie);
      expect(statsRes.body.data.unassignedPatients).toBe(0);

      // Delete p2
      await Patient.findByIdAndDelete(p2._id);
      statsRes = await request(app).get('/api/v1/patients/stats').set('Cookie', authCookie);
      expect(statsRes.body.data.totalPatients).toBe(1);
      expect(statsRes.body.data.criticalPatients).toBe(0);
    });
  });

  describe('Patient Date Range Filtering & Timezone Suite', () => {
    async function seedTestPatients() {
      await Patient.create([
        {
          name: 'Patient Nov 4 Night',
          condition: 'Stable',
          age: 30,
          gender: 'male',
          createdAt: new Date('2026-11-04T23:59:00.000+06:00'),
        },
        {
          name: 'Patient Nov 5 Early',
          condition: 'Under Treatment',
          age: 32,
          gender: 'female',
          createdAt: new Date('2026-11-05T00:05:00.000+06:00'),
        },
        {
          name: 'Patient Nov 5 Late',
          condition: 'Critical',
          age: 45,
          gender: 'male',
          createdAt: new Date('2026-11-05T23:55:00.000+06:00'),
        },
        {
          name: 'Patient Nov 6 Early',
          condition: 'Recovering',
          age: 28,
          gender: 'female',
          createdAt: new Date('2026-11-06T00:05:00.000+06:00'),
        },
      ]);
    }

    it('should filter patients by single-day inclusive range covering entire local calendar day (Asia/Dhaka UTC+6)', async () => {
      await seedTestPatients();

      // Single day filter: 2026-11-05 to 2026-11-05
      const res = await request(app)
        .get('/api/v1/patients?from=2026-11-05&to=2026-11-05')
        .set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.meta.total).toBe(2);
      const names = res.body.data.map((p: any) => p.name);
      expect(names).toContain('Patient Nov 5 Early');
      expect(names).toContain('Patient Nov 5 Late');
      expect(names).not.toContain('Patient Nov 4 Night');
      expect(names).not.toContain('Patient Nov 6 Early');
    });

    it('should support aliased startDate and endDate params across multi-day inclusive range', async () => {
      await seedTestPatients();

      const res = await request(app)
        .get('/api/v1/patients?startDate=2026-11-04&endDate=2026-11-06')
        .set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.meta.total).toBe(4);
    });

    it('should return empty results when date range has no matching records', async () => {
      await seedTestPatients();

      const res = await request(app)
        .get('/api/v1/patients?from=2025-01-01&to=2025-01-02')
        .set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBe(0);
      expect(res.body.data).toHaveLength(0);
    });

    it('should reject inverted date ranges (from > to) with 422 Unprocessable Entity', async () => {
      const res = await request(app)
        .get('/api/v1/patients?from=2026-11-06&to=2026-11-04')
        .set('Cookie', authCookie);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should paginate correctly within date-filtered records', async () => {
      await seedTestPatients();

      const resPage1 = await request(app)
        .get('/api/v1/patients?startDate=2026-11-04&endDate=2026-11-06&page=1&limit=2')
        .set('Cookie', authCookie);

      expect(resPage1.status).toBe(200);
      expect(resPage1.body.data).toHaveLength(2);
      expect(resPage1.body.meta.total).toBe(4);
      expect(resPage1.body.meta.totalPages).toBe(2);
      expect(resPage1.body.meta.page).toBe(1);

      const resPage2 = await request(app)
        .get('/api/v1/patients?startDate=2026-11-04&endDate=2026-11-06&page=2&limit=2')
        .set('Cookie', authCookie);

      expect(resPage2.status).toBe(200);
      expect(resPage2.body.data).toHaveLength(2);
      expect(resPage2.body.meta.page).toBe(2);
    });
  });
});
