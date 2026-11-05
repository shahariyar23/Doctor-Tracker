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

describe('Global Search API Test Suite — GET /api/v1/search', () => {
  let authCookie: string;
  let doctorVance: any;
  let doctorGregory: any;
  let patientMostak: any;
  let patientSarah: any;
  let patientUnassigned: any;

  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();

    // Create an Admin user and issue auth cookie
    const { cookie } = await createTestAdmin();
    authCookie = cookie;

    // Seed test doctors
    doctorVance = await Doctor.create({
      name: 'Dr. Alexander Vance',
      specialization: 'Cardiology',
      hospital: 'St. Jude Memorial Hospital',
      email: 'a.vance@hospital.org',
      phone: '01761102860',
    });

    doctorGregory = await Doctor.create({
      name: 'Dr. Gregory House',
      specialization: 'Diagnostic Medicine',
      hospital: 'Princeton-Plainsboro Teaching Hospital',
      email: 'house.diag@clinical.test.invalid',
      phone: '01761102861',
    });

    // Seed test patients
    patientMostak = await Patient.create({
      name: 'Mostak Shahariyar',
      condition: 'Under Treatment',
      age: 25,
      gender: 'male',
      phone: '01761208866',
      assignedDoctorId: doctorVance._id,
    });

    patientSarah = await Patient.create({
      name: 'Sarah Connor',
      condition: 'Critical',
      age: 34,
      gender: 'female',
      phone: '01761208899',
      assignedDoctorId: doctorGregory._id,
    });

    patientUnassigned = await Patient.create({
      name: 'John Unassigned',
      condition: 'Stable',
      age: 45,
      gender: 'male',
      phone: '01700000000',
      assignedDoctorId: null,
    });
  });

  it('1. should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/v1/search?q=Vance');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('2. should reject missing query param q with 422', async () => {
    const res = await request(app)
      .get('/api/v1/search')
      .set('Cookie', authCookie);
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('3. should reject whitespace-only query with 422', async () => {
    const res = await request(app)
      .get('/api/v1/search?q=   ')
      .set('Cookie', authCookie);
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('4. should reject query shorter than 2 characters with 422', async () => {
    const res = await request(app)
      .get('/api/v1/search?q=a')
      .set('Cookie', authCookie);
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('5. should reject query longer than 100 characters with 422', async () => {
    const longQ = 'a'.repeat(101);
    const res = await request(app)
      .get(`/api/v1/search?q=${longQ}`)
      .set('Cookie', authCookie);
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('6. should reject invalid limit exceeding 10 with 422', async () => {
    const res = await request(app)
      .get('/api/v1/search?q=doctor&limit=25')
      .set('Cookie', authCookie);
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('7. should search Doctor by exact name', async () => {
    const res = await request(app)
      .get('/api/v1/search?q=Alexander Vance')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.doctors).toHaveLength(1);
    expect(res.body.data.doctors[0].name).toBe('Dr. Alexander Vance');
    expect(res.body.data.doctors[0].id).toBe(doctorVance._id.toString());
  });

  it('8. should search Doctor by partial name (case-insensitive)', async () => {
    const res = await request(app)
      .get('/api/v1/search?q=greg')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.doctors).toHaveLength(1);
    expect(res.body.data.doctors[0].name).toBe('Dr. Gregory House');
  });

  it('9. should search Doctor by email', async () => {
    const res = await request(app)
      .get('/api/v1/search?q=a.vance@hospital.org')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.doctors).toHaveLength(1);
    expect(res.body.data.doctors[0].name).toBe('Dr. Alexander Vance');
  });

  it('10. should search Doctor by phone', async () => {
    const res = await request(app)
      .get('/api/v1/search?q=01761102860')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.doctors).toHaveLength(1);
    expect(res.body.data.doctors[0].name).toBe('Dr. Alexander Vance');
  });

  it('11. should search Doctor by specialization', async () => {
    const res = await request(app)
      .get('/api/v1/search?q=Cardiology')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.doctors).toHaveLength(1);
    expect(res.body.data.doctors[0].specialization).toBe('Cardiology');
  });

  it('12. should search Doctor by hospital', async () => {
    const res = await request(app)
      .get('/api/v1/search?q=Princeton-Plainsboro')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.doctors).toHaveLength(1);
    expect(res.body.data.doctors[0].name).toBe('Dr. Gregory House');
  });

  it('13. should search Patient by exact name', async () => {
    const res = await request(app)
      .get('/api/v1/search?q=Mostak Shahariyar')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.patients).toHaveLength(1);
    expect(res.body.data.patients[0].name).toBe('Mostak Shahariyar');
    expect(res.body.data.patients[0].assignedDoctor).toEqual({
      id: doctorVance._id.toString(),
      name: 'Dr. Alexander Vance',
    });
  });

  it('14. should search Patient by partial name (case-insensitive)', async () => {
    const res = await request(app)
      .get('/api/v1/search?q=conn')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.patients).toHaveLength(1);
    expect(res.body.data.patients[0].name).toBe('Sarah Connor');
    expect(res.body.data.patients[0].assignedDoctor.name).toBe('Dr. Gregory House');
  });

  it('15. should search Patient by phone', async () => {
    const res = await request(app)
      .get('/api/v1/search?q=01761208866')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.patients).toHaveLength(1);
    expect(res.body.data.patients[0].name).toBe('Mostak Shahariyar');
  });

  it('16. should search Patient by condition', async () => {
    const res = await request(app)
      .get('/api/v1/search?q=Critical')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.patients).toHaveLength(1);
    expect(res.body.data.patients[0].name).toBe('Sarah Connor');
  });

  it('17. should correctly return assignedDoctor: null for unassigned patient', async () => {
    const res = await request(app)
      .get('/api/v1/search?q=Unassigned')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.patients).toHaveLength(1);
    expect(res.body.data.patients[0].name).toBe('John Unassigned');
    expect(res.body.data.patients[0].assignedDoctor).toBeNull();
  });

  it('18. should safely escape regex special characters without crashing or injection', async () => {
    const res = await request(app)
      .get('/api/v1/search?q=[(.*)]+?')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.doctors).toHaveLength(0);
    expect(res.body.data.patients).toHaveLength(0);
    expect(res.body.data.total).toBe(0);
  });

  it('19. should return empty results when no records match', async () => {
    const res = await request(app)
      .get('/api/v1/search?q=NonExistentTermXYZ')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.doctors).toHaveLength(0);
    expect(res.body.data.patients).toHaveLength(0);
    expect(res.body.data.total).toBe(0);
  });

  it('20. should enforce limit per category correctly', async () => {
    const res = await request(app)
      .get('/api/v1/search?q=01&limit=1')
      .set('Cookie', authCookie);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.doctors.length).toBeLessThanOrEqual(1);
    expect(res.body.data.patients.length).toBeLessThanOrEqual(1);
  });
});
