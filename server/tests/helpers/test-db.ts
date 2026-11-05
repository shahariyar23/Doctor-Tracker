import mongoose from 'mongoose';
import { config } from '../../src/config/index.js';
import { Admin } from '../../src/models/admin.model.js';
import { Doctor } from '../../src/models/doctor.model.js';
import { Patient } from '../../src/models/patient.model.js';
import { RateLimit } from '../../src/models/rate-limit.model.js';
import { signAccessToken } from '../../src/utils/token.util.js';
import { hashPassword } from '../../src/utils/password.util.js';

const TEST_DB_URI = config.mongoUri.replace(/\/[a-zA-Z0-9_-]+(\?|$)/, '/doctor_tracker_vitest$1');

export async function connectTestDb(): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
  const dbName = mongoose.connection.db?.databaseName;
  if (dbName !== 'doctor_tracker_vitest') {
    throw new Error(
      `CRITICAL DATABASE SAFETY VIOLATION: Connected to "${dbName}", expected "doctor_tracker_vitest". Aborting test suite to protect data.`,
    );
  }
}

export async function clearTestDb(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    const dbName = mongoose.connection.db?.databaseName;
    if (dbName !== 'doctor_tracker_vitest') {
      throw new Error(
        `CRITICAL DATABASE SAFETY VIOLATION: Active database is "${dbName}", expected "doctor_tracker_vitest". Aborting clearTestDb to protect data.`,
      );
    }

    await Promise.all([
      Admin.deleteMany({}),
      Doctor.deleteMany({}),
      Patient.deleteMany({}),
      RateLimit.deleteMany({}),
    ]);
  }
}

export async function disconnectTestDb(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await clearTestDb();
    await mongoose.disconnect();
  }
}

export async function createTestAdmin(): Promise<{
  admin: InstanceType<typeof Admin>;
  cookie: string;
  token: string;
}> {
  const passwordHash = await hashPassword('AdminPassword#2026');
  const admin = await Admin.create({
    name: 'Automated Test Admin',
    email: `test_admin_${Date.now()}@doctortracker.com`,
    passwordHash,
  });

  const token = signAccessToken(admin._id.toString());
  const cookie = `token=${token}`;

  return { admin, cookie, token };
}
