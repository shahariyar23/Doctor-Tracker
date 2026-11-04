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

describe('Phase 09 & 10: Dashboard Analytics & Insights Test Suite', () => {
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

  it('should block unauthenticated access to dashboard with 401', async () => {
    const res = await request(app).get('/api/v1/dashboard/overview');
    expect(res.status).toBe(401);
  });

  it('should safely handle an empty database with zero totals and clean messages', async () => {
    const res = await request(app).get('/api/v1/dashboard/overview').set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.totalDoctors).toBe(0);
    expect(res.body.data.totalPatients).toBe(0);
    expect(res.body.data.patientsPerDoctor).toEqual([]);
    expect(res.body.data.topConditions).toEqual([]);
    expect(res.body.data.insights[0]).toContain('no recorded doctors or patients');
  });

  it('should compute accurate all-time vs date-filtered overview statistics', async () => {
    const docA = await Doctor.create({
      name: 'Dr. Alice Adams',
      specialization: 'Cardiology',
      hospital: 'St. Jude',
      phone: '+1-555-0101',
      email: 'adams@stjude.org',
      createdAt: new Date('2026-05-01T12:00:00.000Z'),
    });

    const docB = await Doctor.create({
      name: 'Dr. Bob Brown',
      specialization: 'Pediatrics',
      hospital: 'Childrens Hospital',
      phone: '+1-555-0102',
      email: 'brown@childrens.org',
      createdAt: new Date('2026-06-01T12:00:00.000Z'),
    });

    // 2 patients for docA in May
    await Patient.create([
      {
        name: 'Patient 1',
        condition: 'Hypertension',
        assignedDoctorId: docA._id,
        age: 30,
        gender: 'male',
        createdAt: new Date('2026-05-10T10:00:00.000Z'),
      },
      {
        name: 'Patient 2',
        condition: 'Hypertension',
        assignedDoctorId: docA._id,
        age: 40,
        gender: 'female',
        createdAt: new Date('2026-05-12T10:00:00.000Z'),
      },
    ]);

    // Query overview with May 1 - May 20 filter
    const res = await request(app)
      .get('/api/v1/dashboard/overview?from=2026-05-01&to=2026-05-20')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.totalDoctors).toBe(2); // All-time
    expect(res.body.data.totalPatients).toBe(2); // All-time
    expect(res.body.data.newDoctors).toBe(1); // Only docA created in May
    expect(res.body.data.newPatients).toBe(2); // Both patients created in May

    // Doctor with zero patients included
    const perDoctor = res.body.data.patientsPerDoctor;
    expect(perDoctor.length).toBe(2);
    const docBStats = perDoctor.find((d: any) => d.doctorName === 'Dr. Bob Brown');
    expect(docBStats.patientCount).toBe(0);

    // Insights generated
    expect(res.body.data.insights.length).toBeGreaterThan(0);
  });

  it('should generate continuous daily trends and fill zero-count dates', async () => {
    const doc = await Doctor.create({
      name: 'Dr. Trend',
      specialization: 'Cardiology',
      hospital: 'General',
      phone: '+1-555-0111',
      email: 'trend@gen.org',
    });

    await Patient.create({
      name: 'Patient Day',
      condition: 'Asthma',
      assignedDoctorId: doc._id,
      age: 28,
      gender: 'female',
      createdAt: new Date('2026-05-10T12:00:00.000Z'),
    });

    const res = await request(app)
      .get('/api/v1/dashboard/patient-trends?from=2026-05-09&to=2026-05-11&interval=day')
      .set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.labels).toEqual(['2026-05-09', '2026-05-10', '2026-05-11']);
    expect(res.body.data.datasets[0].data).toEqual([0, 1, 0]);
  });

  it('should return conditions distribution sorted by count descending', async () => {
    const doc = await Doctor.create({
      name: 'Dr. Clinic',
      specialization: 'General',
      hospital: 'Clinic',
      phone: '+1-555-0999',
      email: 'clinic@doc.org',
    });

    await Patient.create([
      { name: 'P1', condition: 'Diabetes', assignedDoctorId: doc._id, age: 30, gender: 'male' },
      { name: 'P2', condition: 'Diabetes', assignedDoctorId: doc._id, age: 31, gender: 'female' },
      { name: 'P3', condition: 'Asthma', assignedDoctorId: doc._id, age: 32, gender: 'male' },
    ]);

    const res = await request(app).get('/api/v1/dashboard/conditions').set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.data[0].condition).toBe('Diabetes');
    expect(res.body.data[0].count).toBe(2);
    expect(res.body.data[1].condition).toBe('Asthma');
    expect(res.body.data[1].count).toBe(1);
  });

  it('should reject invalid calendar dates and from > to with 422', async () => {
    const badDateRes = await request(app)
      .get('/api/v1/dashboard/overview?from=2026-02-30')
      .set('Cookie', authCookie);
    expect(badDateRes.status).toBe(422);

    const reversedDatesRes = await request(app)
      .get('/api/v1/dashboard/overview?from=2026-05-10&to=2026-05-01')
      .set('Cookie', authCookie);
    expect(reversedDatesRes.status).toBe(422);
  });
});
