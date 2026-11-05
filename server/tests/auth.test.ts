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
import { RateLimit } from '../src/models/rate-limit.model.js';
import { clearAllRateLimits } from '../src/middlewares/rate-limit.middleware.js';

describe('Phase 05 & 10: Authentication & Security Test Suite', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    await clearAllRateLimits();
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

  describe('Login Brute-Force & Rate Limiting Protection', () => {
    it('should allow up to 5 failed login attempts and block the 6th with HTTP 429 and Retry-After header', async () => {
      const { admin } = await createTestAdmin();
      const testIp = '198.51.100.10';

      // 5 consecutive failed attempts
      for (let i = 1; i <= 5; i++) {
        const res = await request(app)
          .post('/api/v1/auth/login')
          .set('X-Forwarded-For', testIp)
          .send({
            email: admin.email,
            password: 'WrongPassword#123',
          });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Invalid email or password combination');
      }

      // 6th attempt from the same IP must be rejected with 429 Too Many Requests
      const blockedRes = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', testIp)
        .send({
          email: admin.email,
          password: 'WrongPassword#123',
        });

      expect(blockedRes.status).toBe(429);
      expect(blockedRes.body.success).toBe(false);
      expect(blockedRes.body.message).toContain('Too many failed login attempts');
      expect(blockedRes.body.errors).toBeNull();

      // Verify Retry-After header
      const retryAfter = blockedRes.headers['retry-after'];
      expect(retryAfter).toBeDefined();
      const retrySeconds = parseInt(retryAfter as string, 10);
      expect(Number.isInteger(retrySeconds)).toBe(true);
      expect(retrySeconds).toBeGreaterThan(0);
      expect(retrySeconds).toBeLessThanOrEqual(900); // <= 15 minutes
    });

    it('should reset failed-attempt tracking on successful login', async () => {
      const { admin } = await createTestAdmin();
      const testIp = '198.51.100.20';

      // 3 failed attempts
      for (let i = 1; i <= 3; i++) {
        const failRes = await request(app)
          .post('/api/v1/auth/login')
          .set('X-Forwarded-For', testIp)
          .send({
            email: admin.email,
            password: 'WrongPassword#123',
          });
        expect(failRes.status).toBe(401);
      }

      // 4th attempt: successful login with correct password
      const successRes = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', testIp)
        .send({
          email: admin.email,
          password: 'AdminPassword#2026',
        });
      expect(successRes.status).toBe(200);
      expect(successRes.body.success).toBe(true);

      // Successful login should reset failed attempts counter:
      // The user should now be allowed 5 fresh failed attempts before receiving 429
      for (let i = 1; i <= 5; i++) {
        const failRes = await request(app)
          .post('/api/v1/auth/login')
          .set('X-Forwarded-For', testIp)
          .send({
            email: admin.email,
            password: 'WrongPassword#123',
          });
        expect(failRes.status).toBe(401);
      }

      // 6th attempt after reset triggers 429
      const blockedRes = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', testIp)
        .send({
          email: admin.email,
          password: 'WrongPassword#123',
        });
      expect(blockedRes.status).toBe(429);
    });

    it('should trigger account-based protection when different IP addresses attack the same account', async () => {
      const { admin } = await createTestAdmin();

      // 5 different IP addresses each make 1 failed attempt against admin.email
      for (let i = 1; i <= 5; i++) {
        const ip = `192.0.2.${i}`;
        const res = await request(app)
          .post('/api/v1/auth/login')
          .set('X-Forwarded-For', ip)
          .send({
            email: admin.email,
            password: `WrongGuess#${i}`,
          });
        expect(res.status).toBe(401);
      }

      // 6th attempt from a completely new IP (192.0.2.99) against the same account
      const res6 = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', '192.0.2.99')
        .send({
          email: admin.email,
          password: 'WrongGuess#6',
        });

      // Account-based protection must trigger 429
      expect(res6.status).toBe(429);
      expect(res6.body.message).toContain('Too many failed login attempts');
      expect(res6.headers['retry-after']).toBeDefined();
    });

    it('should not reveal whether an email address exists when applying account rate limits', async () => {
      const nonExistentEmail = 'ghost_user@doctortracker.com';

      // 5 failed attempts against non-existent account from 5 different IPs
      for (let i = 1; i <= 5; i++) {
        const ip = `198.18.0.${i}`;
        const res = await request(app)
          .post('/api/v1/auth/login')
          .set('X-Forwarded-For', ip)
          .send({
            email: nonExistentEmail,
            password: `RandomPassword#${i}`,
          });
        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Invalid email or password combination');
      }

      // 6th attempt from another IP must return 429 identically to an existing account
      const res6 = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', '198.18.0.99')
        .send({
          email: nonExistentEmail,
          password: 'RandomPassword#6',
        });

      expect(res6.status).toBe(429);
      expect(res6.body.message).toContain('Too many failed login attempts');
    });

    it('should allow legitimate login after the cooldown period expires', async () => {
      const { admin } = await createTestAdmin();
      const testIp = '198.51.100.40';

      // 5 failed attempts
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .set('X-Forwarded-For', testIp)
          .send({ email: admin.email, password: 'WrongPassword#123' });
      }

      // 6th attempt is blocked
      const blockedRes = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', testIp)
        .send({ email: admin.email, password: 'WrongPassword#123' });
      expect(blockedRes.status).toBe(429);

      // Simulate cooldown window expiration by advancing resetTime into the past
      await RateLimit.updateMany({}, { $set: { resetTime: new Date(Date.now() - 1000) } });

      // User enters the correct password after cooldown
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', testIp)
        .send({
          email: admin.email,
          password: 'AdminPassword#2026',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data.user.email).toBe(admin.email);
    });

    it('should correctly handle proxy headers and isolate rate limits per client IP', async () => {
      const { admin } = await createTestAdmin();

      const clientIp1 = '203.0.113.111';
      const clientIp2 = '203.0.113.222';

      // 5 failed attempts from Client IP 1 (on different emails to test IP limiter alone)
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .set('X-Forwarded-For', clientIp1)
          .send({ email: `user_${i}@doctortracker.com`, password: 'WrongPassword#123' });
      }

      // Client IP 1 is now rate-limited
      const ip1Blocked = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', clientIp1)
        .send({ email: `user_new@doctortracker.com`, password: 'WrongPassword#123' });
      expect(ip1Blocked.status).toBe(429);

      // Client IP 2 should NOT be blocked and should receive 401 (not 429)
      const ip2Allowed = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', clientIp2)
        .send({ email: admin.email, password: 'WrongPassword#123' });
      expect(ip2Allowed.status).toBe(401);
    });

    it('should not rate limit authenticated API requests with the login brute-force limiter', async () => {
      const { cookie } = await createTestAdmin();
      const testIp = '198.51.100.99';

      // Exhaust login budget from this IP
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .set('X-Forwarded-For', testIp)
          .send({ email: `attacker_${i}@doctortracker.com`, password: 'WrongPassword#123' });
      }

      // Login endpoint is blocked
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .set('X-Forwarded-For', testIp)
        .send({ email: `attacker_6@doctortracker.com`, password: 'WrongPassword#123' });
      expect(loginRes.status).toBe(429);

      // Authenticated endpoints like /api/v1/auth/me or /api/v1/patients must NOT be blocked
      for (let i = 1; i <= 10; i++) {
        const meRes = await request(app)
          .get('/api/v1/auth/me')
          .set('X-Forwarded-For', testIp)
          .set('Cookie', cookie);
        expect(meRes.status).toBe(200);
      }
    });
  });
});
