import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.js';

export const JWT_ISSUER = 'doctor-tracker-api';
export const JWT_AUDIENCE = 'doctor-tracker-client';

export interface TokenPayload {
  sub: string;
}

/**
 * Signs an access token for an authenticated administrator.
 * Enforces HS256 algorithm, sub, iss, aud, and expiration.
 */
export function signAccessToken(adminId: string): string {
  const options: SignOptions = {
    algorithm: 'HS256',
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    expiresIn: config.jwtExpiresIn as unknown as number, // jsonwebtoken accepts string formats like '1h'
  };

  return jwt.sign({ sub: adminId }, config.jwtSecret, options);
}

/**
 * Verifies an access token and returns its decoded claims.
 * Enforces HS256 algorithm, iss, and aud checks.
 * Throws an error if invalid or expired.
 */
export function verifyAccessToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, config.jwtSecret, {
    algorithms: ['HS256'],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });

  if (typeof decoded !== 'object' || !decoded || !('sub' in decoded)) {
    throw new Error('Invalid token payload structure');
  }

  return { sub: (decoded as { sub: string }).sub };
}
