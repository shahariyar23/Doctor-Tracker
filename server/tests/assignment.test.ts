import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import {
  connectTestDb,
  clearTestDb,
  disconnectTestDb,
  createTestAdmin,
} from './helpers/test-db.js';
import { Doctor } from '../src/models/doctor.model.js';
import { Patient } from '../src/models/patient.model.js';

describe('Phase 06 QA: Doctor Assignment, Reassignment & Data Integrity Suite', () => {
  let authCookie: string;
  let doctorA: InstanceType<typeof Doctor>;
  let doctorB: InstanceType<typeof Doctor>;
  let unassignedPatient: InstanceType<typeof Patient>;

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

    // Create 2 test doctors
    doctorA = await Doctor.create({
      name: 'Dr. Gregory House',
      specialization: 'Diagnostic Medicine',
      hospital: 'Princeton-Plainsboro',
      phone: '+1-555-0101',
      email: 'house@princeton.test.invalid',
    });

    doctorB = await Doctor.create({
      name: 'Dr. Allison Cameron',
      specialization: 'Immunology',
      hospital: 'Mercy Hospital',
      phone: '+1-555-0102',
      email: 'cameron@mercy.test.invalid',
    });

    // Create an unassigned patient
    unassignedPatient = await Patient.create({
      name: 'Arthur Dent',
      condition: 'Chronic Fatigue',
      age: 42,
      gender: 'male',
      phone: '+1-555-0201',
      assignedDoctorId: null,
    });
  });

  it('1. should assign an unassigned Patient to a Doctor', async () => {
    const res = await request(app)
      .patch(`/api/v1/patients/${unassignedPatient._id}`)
      .set('Cookie', authCookie)
      .send({ assignedDoctorId: doctorA._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.assignedDoctorId._id.toString()).toBe(doctorA._id.toString());

    // 2. Verify assignedDoctorId changes in MongoDB
    const updatedInDb = await Patient.findById(unassignedPatient._id);
    expect(updatedInDb?.assignedDoctorId?.toString()).toBe(doctorA._id.toString());
  });

  it('3. should verify patient appears in doctor A profile/patient query', async () => {
    // Assign to Doctor A
    await Patient.findByIdAndUpdate(unassignedPatient._id, {
      assignedDoctorId: doctorA._id,
    });

    const res = await request(app)
      .get(`/api/v1/patients?doctorId=${doctorA._id}`)
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0]._id.toString()).toBe(unassignedPatient._id.toString());
  });

  it('4 & 5. should reassign patient to doctor B and disappear from doctor A', async () => {
    // Initially assigned to Doctor A
    await Patient.findByIdAndUpdate(unassignedPatient._id, {
      assignedDoctorId: doctorA._id,
    });

    // Reassign to Doctor B
    const res = await request(app)
      .patch(`/api/v1/patients/${unassignedPatient._id}`)
      .set('Cookie', authCookie)
      .send({ assignedDoctorId: doctorB._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.data.assignedDoctorId._id.toString()).toBe(doctorB._id.toString());

    // Query Doctor A - should have 0 patients
    const resA = await request(app)
      .get(`/api/v1/patients?doctorId=${doctorA._id}`)
      .set('Cookie', authCookie);
    expect(resA.body.data.length).toBe(0);

    // Query Doctor B - should have 1 patient
    const resB = await request(app)
      .get(`/api/v1/patients?doctorId=${doctorB._id}`)
      .set('Cookie', authCookie);
    expect(resB.body.data.length).toBe(1);
    expect(resB.body.data[0]._id.toString()).toBe(unassignedPatient._id.toString());
  });

  it('6. should unassign a patient by setting assignedDoctorId to null', async () => {
    // Initially assigned to Doctor A
    await Patient.findByIdAndUpdate(unassignedPatient._id, {
      assignedDoctorId: doctorA._id,
    });

    const res = await request(app)
      .patch(`/api/v1/patients/${unassignedPatient._id}`)
      .set('Cookie', authCookie)
      .send({ assignedDoctorId: null });

    expect(res.status).toBe(200);
    expect(res.body.data.assignedDoctorId).toBeNull();

    const dbPatient = await Patient.findById(unassignedPatient._id);
    expect(dbPatient?.assignedDoctorId).toBeNull();
  });

  it('7. should NOT create a duplicate patient document during assignment', async () => {
    const countBefore = await Patient.countDocuments({});
    expect(countBefore).toBe(1);

    await request(app)
      .patch(`/api/v1/patients/${unassignedPatient._id}`)
      .set('Cookie', authCookie)
      .send({ assignedDoctorId: doctorA._id.toString() });

    const countAfter = await Patient.countDocuments({});
    expect(countAfter).toBe(countBefore); // Absolutely no new document created
  });

  it('8. should verify all other patient fields remain unchanged after assignment', async () => {
    await request(app)
      .patch(`/api/v1/patients/${unassignedPatient._id}`)
      .set('Cookie', authCookie)
      .send({ assignedDoctorId: doctorA._id.toString() });

    const dbPatient = await Patient.findById(unassignedPatient._id);
    expect(dbPatient?.name).toBe('Arthur Dent');
    expect(dbPatient?.condition).toBe('Chronic Fatigue');
    expect(dbPatient?.age).toBe(42);
    expect(dbPatient?.gender).toBe('male');
    expect(dbPatient?.phone).toBe('+1-555-0201');
    expect(dbPatient?.createdAt.toISOString()).toBe(unassignedPatient.createdAt.toISOString());
  });

  it('9. should reject an invalid doctor ObjectId format with 422', async () => {
    const res = await request(app)
      .patch(`/api/v1/patients/${unassignedPatient._id}`)
      .set('Cookie', authCookie)
      .send({ assignedDoctorId: 'invalid-id' });

    expect(res.status).toBe(422);
  });

  it('10. should reject a nonexistent doctor ObjectId with 400', async () => {
    const nonExistentDocId = '654321654321654321654321';
    const res = await request(app)
      .patch(`/api/v1/patients/${unassignedPatient._id}`)
      .set('Cookie', authCookie)
      .send({ assignedDoctorId: nonExistentDocId });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('does not exist');
  });

  it('11. should handle missing/nonexistent patient with 404', async () => {
    const nonExistentPatientId = '654321654321654321654321';
    const res = await request(app)
      .patch(`/api/v1/patients/${nonExistentPatientId}`)
      .set('Cookie', authCookie)
      .send({ assignedDoctorId: doctorA._id.toString() });

    expect(res.status).toBe(404);
  });

  it('12. should handle assigning a patient to the same doctor idempotently', async () => {
    await Patient.findByIdAndUpdate(unassignedPatient._id, {
      assignedDoctorId: doctorA._id,
    });

    const res = await request(app)
      .patch(`/api/v1/patients/${unassignedPatient._id}`)
      .set('Cookie', authCookie)
      .send({ assignedDoctorId: doctorA._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.data.assignedDoctorId._id.toString()).toBe(doctorA._id.toString());
  });
});

