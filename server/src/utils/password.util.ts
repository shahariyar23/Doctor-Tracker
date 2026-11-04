import bcrypt from "bcrypt";

const BCRYPT_ROUNDS = 12;

/**
 * Valid pre-generated bcrypt hash with cost factor 12.
 * Used for constant-time comparison when an admin user does not exist in the database,
 * mitigating timing attacks for user enumeration without repeatedly hashing on every failed attempt.
 */
export const DUMMY_HASH =
  "$2b$12$K14kLwR61R6cZqL54x08teN32vF69f6P4fF1QJv4d0k5f1jK87t9m";

/**
 * Hashes a plaintext password using bcrypt with cost factor 12.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Compares a plaintext password against a stored bcrypt hash.
 */
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Performs a constant-time comparison against a valid cost-12 dummy hash.
 * Always resolves to false.
 */
export async function compareWithDummy(password: string): Promise<boolean> {
  await bcrypt.compare(password, DUMMY_HASH);
  return false;
}

