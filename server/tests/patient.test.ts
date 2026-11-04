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
});
