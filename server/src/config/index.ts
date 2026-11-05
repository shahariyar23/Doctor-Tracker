import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  env: string;
  port: number;
  clientUrl: string;
  mongoUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  trustProxy: string | number | boolean;
  adminName?: string;
  adminEmail?: string;
  adminPassword?: string;
}

const jwtSecret = process.env.JWT_SECRET || '';

// Validate JWT_SECRET on startup
if (process.env.NODE_ENV === 'production' || process.env.VALIDATE_SECRETS === 'true') {
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error('Fatal: JWT_SECRET must be defined and at least 32 characters long');
  }
  const disallowedPlaceholders = ['secret', 'changeme', 'jwtsecret', 'password'];
  if (disallowedPlaceholders.some((ph) => jwtSecret.toLowerCase().includes(ph))) {
    throw new Error(
      'Fatal: Insecure placeholder detected in JWT_SECRET. Use a high-entropy secret.',
    );
  }
}

function parseTrustProxy(value?: string, _env?: string): string | number | boolean {
  if (value === undefined || value === '') {
    // Single-hop proxy trust (e.g. Vercel, Render, Nginx, AWS ALB)
    return 1;
  }
  if (value === 'true') return 1;
  if (value === 'false') return false;
  const num = parseInt(value, 10);
  if (!Number.isNaN(num)) return num;
  return value;
}

export function normalizeMongoUri(rawUri?: string): string {
  const defaultLocal = 'mongodb://localhost:27017/doctor_tracker';
  if (!rawUri || !rawUri.trim()) return defaultLocal;

  const trimmed = rawUri.trim();

  // If already contains doctor_tracker or another explicit database name path:
  const matchesNamedDb = /\/([a-zA-Z0-9_-]+)(\?|$)/.exec(trimmed);
  if (matchesNamedDb && matchesNamedDb[1] && matchesNamedDb[1] !== 'admin') {
    return trimmed;
  }

  // If URI has query parameters but no database path:
  if (trimmed.includes('?')) {
    return trimmed.replace(/\/?\?/, '/doctor_tracker?');
  }

  // If URI ends with slash:
  if (trimmed.endsWith('/')) {
    return `${trimmed}doctor_tracker`;
  }

  return `${trimmed}/doctor_tracker`;
}

export const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  mongoUri: normalizeMongoUri(process.env.MONGODB_URI),
  jwtSecret: jwtSecret || 'dev-insecure-jwt-secret-min-32-chars-long-doctor-tracker-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY, process.env.NODE_ENV),
  adminName: process.env.ADMIN_NAME,
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
};
