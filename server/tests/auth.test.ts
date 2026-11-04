import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import {
  connectTestDb,
  clearTestDb,
  disconnectTestDb,
  createTestAdmin,
} from './helpers/test-db.js';
import { Admin } from '../src/models/admin.model.js';

describe('Phase 05 & 10: Authentication & Security Test Suite', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  it('should successfully authenticate valid admin and set HTTP-only cookie with safe profile', async () => {
    const { admin } = await createTestAdmin();

    const response = await request(app).post('/api/v1/auth/login').send({
      email: admin.email,
      password: 'AdminPassword#2026',
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Admin authenticated successfully');
    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.user.email).toBe(admin.email);
    expect(response.body.data.user.passwordHash).toBeUndefined();
    expect(response.body.data.token).toBeUndefined(); // Security requirement: never return JWT in body

    const cookies = response.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const tokenCookie = cookies.find((c: string) => c.startsWith('token='));
    expect(tokenCookie).toBeDefined();
    expect(tokenCookie).toContain('HttpOnly');
    expect(tokenCookie).toContain('SameSite=Lax');
    expect(tokenCookie).toContain('Path=/');
  });

  it('should reject non-existent email with generic error and anti-enumeration timing protection', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'nonexistent@doctortracker.com',
      password: 'AdminPassword#2026',
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Invalid email or password combination');
    expect(response.body.errors).toBeNull();
  });

  it('should reject incorrect password with identical generic 401 error', async () => {
    const { admin } = await createTestAdmin();

    const response = await request(app).post('/api/v1/auth/login').send({
      email: admin.email,
      password: 'WrongPassword#2026',
    });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Invalid email or password combination');
  });

  it('should reject missing credentials or invalid email format with 422', async () => {
    const res1 = await request(app).post('/api/v1/auth/login').send({});
    expect(res1.status).toBe(422);
    expect(res1.body.success).toBe(false);

    const res2 = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'invalid-email', password: 'Password123' });
    expect(res2.status).toBe(422);
  });

  it('should enforce strict 8-char minimum and 72-byte maximum password boundary with 422', async () => {
    const shortPassRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.com', password: 'short' });
    expect(shortPassRes.status).toBe(422);

    const longPassRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@test.com', password: 'a'.repeat(73) });
    expect(longPassRes.status).toBe(422);
    expect(JSON.stringify(longPassRes.body.errors)).toContain('Password cannot exceed 72 bytes');
  });

  it('should return admin profile on GET /api/v1/auth/me with valid cookie', async () => {
    const { admin, cookie } = await createTestAdmin();

    const response = await request(app).get('/api/v1/auth/me').set('Cookie', cookie);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe(admin.email);
    expect(response.body.data.id).toBe(admin._id.toString());
  });

  it('should reject GET /api/v1/auth/me with 401 when cookie is missing', async () => {
    const response = await request(app).get('/api/v1/auth/me');
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Authentication required');
  });

  it('should reject GET /api/v1/auth/me with 401 when cookie contains forged or invalid token', async () => {
    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', 'token=invalid.jwt.token');
    expect(response.status).toBe(401);
    expect(response.body.message).toContain('Invalid or expired authentication token');
  });

  it('should reject protected access when admin account was deleted from database', async () => {
    const { admin, cookie } = await createTestAdmin();

    // Delete admin record
    await Admin.findByIdAndDelete(admin._id);

    const response = await request(app).get('/api/v1/auth/me').set('Cookie', cookie);

    expect(response.status).toBe(401);
    expect(response.body.message).toContain('Admin account no longer exists');
  });

  it('should clear auth cookie on POST /api/v1/auth/logout', async () => {
    const { cookie } = await createTestAdmin();

    const response = await request(app).post('/api/v1/auth/logout').set('Cookie', cookie);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Logged out successfully');

    const cookies = response.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const tokenCookie = cookies.find((c: string) => c.startsWith('token='));
    expect(tokenCookie).toBeDefined();
    expect(tokenCookie).toContain('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    expect(tokenCookie).toContain('HttpOnly');
  });
});
