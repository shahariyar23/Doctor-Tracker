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

describe('Phase 06, 08 & 10: Doctor CRUD, Search & Pagination Test Suite', () => {
  let authCookie: string;

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
  });

  it('should block unauthenticated access to Doctor endpoints with 401', async () => {
    const res = await request(app).get('/api/v1/doctors');
    expect(res.status).toBe(401);
  });

  it('should create a Doctor with valid data and return 201', async () => {
    const doctorData = {
      name: 'Dr. Gregory House',
      specialization: 'Nephrology',
      hospital: 'Princeton-Plainsboro',
      phone: '+1-555-0199',
      email: 'house@princeton.edu',
    };

    const res = await request(app)
      .post('/api/v1/doctors')
      .set('Cookie', authCookie)
      .send(doctorData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(doctorData.name);
    expect(res.body.data.email).toBe(doctorData.email);
    expect(res.body.data._id).toBeDefined();

    const inDb = await Doctor.findById(res.body.data._id);
    expect(inDb).not.toBeNull();
  });

  it('should reject invalid email and missing required fields with 422', async () => {
    const res = await request(app).post('/api/v1/doctors').set('Cookie', authCookie).send({
      name: 'Dr. Invalid',
      email: 'bad-email',
    });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('should reject duplicate doctor email with 409 Conflict', async () => {
    const doctorData = {
      name: 'Dr. Gregory House',
      specialization: 'Nephrology',
      hospital: 'Princeton-Plainsboro',
      phone: '+1-555-0199',
      email: 'house@princeton.edu',
    };

    await Doctor.create(doctorData);

    const res = await request(app)
      .post('/api/v1/doctors')
      .set('Cookie', authCookie)
      .send(doctorData);

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('already exists');
  });

  it('should retrieve a single doctor by valid ID', async () => {
    const doctor = await Doctor.create({
      name: 'Dr. James Wilson',
      specialization: 'Oncology',
      hospital: 'Princeton-Plainsboro',
      phone: '+1-555-0188',
      email: 'wilson@princeton.edu',
    });

    const res = await request(app).get(`/api/v1/doctors/${doctor._id}`).set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Dr. James Wilson');
  });

  it('should reject malformed ObjectId with 422 and non-existent ID with 404', async () => {
    const malformedRes = await request(app)
      .get('/api/v1/doctors/invalid-id')
      .set('Cookie', authCookie);
    expect(malformedRes.status).toBe(422);

    const nonExistentId = new mongoose.Types.ObjectId();
    const notFoundRes = await request(app)
      .get(`/api/v1/doctors/${nonExistentId}`)
      .set('Cookie', authCookie);
    expect(notFoundRes.status).toBe(404);
  });

  it('should partially update a doctor and reject empty update bodies', async () => {
    const doctor = await Doctor.create({
      name: 'Dr. Eric Foreman',
      specialization: 'Neurology',
      hospital: 'Princeton-Plainsboro',
      phone: '+1-555-0177',
      email: 'foreman@princeton.edu',
    });

    const emptyRes = await request(app)
      .patch(`/api/v1/doctors/${doctor._id}`)
      .set('Cookie', authCookie)
      .send({});
    expect(emptyRes.status).toBe(422);

    const updateRes = await request(app)
      .patch(`/api/v1/doctors/${doctor._id}`)
      .set('Cookie', authCookie)
      .send({ hospital: 'Mercy General Hospital' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.hospital).toBe('Mercy General Hospital');
    expect(updateRes.body.data.specialization).toBe('Neurology');
  });

  it('should block deleting a Doctor when assigned Patients exist (409 Conflict)', async () => {
    const doctor = await Doctor.create({
      name: 'Dr. Robert Chase',
      specialization: 'Intensive Care',
      hospital: 'Princeton-Plainsboro',
      phone: '+1-555-0166',
      email: 'chase@princeton.edu',
    });

    const patient = await Patient.create({
      name: 'Test Patient',
      condition: 'Severe Fever',
      assignedDoctorId: doctor._id,
      age: 32,
      gender: 'male',
    });

    const deleteRes = await request(app)
      .delete(`/api/v1/doctors/${doctor._id}`)
      .set('Cookie', authCookie);

    expect(deleteRes.status).toBe(409);
    expect(deleteRes.body.message).toContain('patient(s) assigned');

    // Verify patient was not deleted
    const patientStillExists = await Patient.findById(patient._id);
    expect(patientStillExists).not.toBeNull();
  });

  it('should delete a Doctor without assigned patients', async () => {
    const doctor = await Doctor.create({
      name: 'Dr. Allison Cameron',
      specialization: 'Immunology',
      hospital: 'Princeton-Plainsboro',
      phone: '+1-555-0155',
      email: 'cameron@princeton.edu',
    });

    const deleteRes = await request(app)
      .delete(`/api/v1/doctors/${doctor._id}`)
      .set('Cookie', authCookie);

    expect(deleteRes.status).toBe(200);
    const inDb = await Doctor.findById(doctor._id);
    expect(inDb).toBeNull();
  });

  it('should support pagination, multi-field search and date range filtering', async () => {
    const baseDate = new Date('2026-05-01T10:00:00.000Z');
    const docs = [];
    for (let i = 1; i <= 12; i++) {
      docs.push({
        name: `Doctor_${i.toString().padStart(2, '0')}`,
        specialization: i % 2 === 0 ? 'Cardiology' : 'Pediatrics',
        hospital: 'City Central',
        phone: `+1-555-02${i.toString().padStart(2, '0')}`,
        email: `doc_${i}@city.org`,
        createdAt: new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000),
      });
    }
    await Doctor.insertMany(docs);

    // Default pagination
    const page1Res = await request(app).get('/api/v1/doctors').set('Cookie', authCookie);
    expect(page1Res.status).toBe(200);
    expect(page1Res.body.data.length).toBe(10);
    expect(page1Res.body.meta.total).toBe(12);
    expect(page1Res.body.meta.totalPages).toBe(2);

    // Search specialization
    const searchRes = await request(app)
      .get('/api/v1/doctors?search=Cardiology')
      .set('Cookie', authCookie);
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.meta.total).toBe(6);

    // Date range
    const dateRes = await request(app)
      .get('/api/v1/doctors?from=2026-05-03&to=2026-05-06')
      .set('Cookie', authCookie);
    expect(dateRes.status).toBe(200);
    expect(dateRes.body.meta.total).toBe(4);
  });

  describe('Doctor Date Range Filtering & Timezone Suite', () => {
    async function seedTestDoctors() {
      await Doctor.create([
        {
          name: 'Doctor Nov 4 Night',
          specialization: 'Neurology',
          hospital: 'City Hosp',
          phone: '+1-555-1104',
          email: 'nov4night@doc.org',
          createdAt: new Date('2026-11-04T23:59:00.000+06:00'),
        },
        {
          name: 'Doctor Nov 5 Early',
          specialization: 'Cardiology',
          hospital: 'City Hosp',
          phone: '+1-555-1105',
          email: 'nov5early@doc.org',
          createdAt: new Date('2026-11-05T00:05:00.000+06:00'),
        },
        {
          name: 'Doctor Nov 5 Late',
          specialization: 'Pediatrics',
          hospital: 'City Hosp',
          phone: '+1-555-1106',
          email: 'nov5late@doc.org',
          createdAt: new Date('2026-11-05T23:55:00.000+06:00'),
        },
        {
          name: 'Doctor Nov 6 Early',
          specialization: 'Orthopedics',
          hospital: 'City Hosp',
          phone: '+1-555-1107',
          email: 'nov6early@doc.org',
          createdAt: new Date('2026-11-06T00:05:00.000+06:00'),
        },
      ]);
    }

    it('should filter doctors by single-day inclusive range covering entire local calendar day (Asia/Dhaka UTC+6)', async () => {
      await seedTestDoctors();

      // Single day filter: 2026-11-05 to 2026-11-05
      const res = await request(app)
        .get('/api/v1/doctors?from=2026-11-05&to=2026-11-05')
        .set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.meta.total).toBe(2);
      const names = res.body.data.map((d: any) => d.name);
      expect(names).toContain('Doctor Nov 5 Early');
      expect(names).toContain('Doctor Nov 5 Late');
      expect(names).not.toContain('Doctor Nov 4 Night');
      expect(names).not.toContain('Doctor Nov 6 Early');
    });

    it('should support aliased startDate and endDate params across multi-day inclusive range', async () => {
      await seedTestDoctors();

      const res = await request(app)
        .get('/api/v1/doctors?startDate=2026-11-04&endDate=2026-11-06')
        .set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.meta.total).toBe(4);
    });

    it('should return empty results when date range has no matching records', async () => {
      await seedTestDoctors();

      const res = await request(app)
        .get('/api/v1/doctors?from=2025-01-01&to=2025-01-02')
        .set('Cookie', authCookie);

      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBe(0);
      expect(res.body.data).toHaveLength(0);
    });

    it('should reject inverted date ranges (from > to) with 422 Unprocessable Entity', async () => {
      const res = await request(app)
        .get('/api/v1/doctors?from=2026-11-06&to=2026-11-04')
        .set('Cookie', authCookie);

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });
  });
});
