import dotenv from "dotenv";

dotenv.config();

export interface Config {
  env: string;
  port: number;
  clientUrl: string;
  mongoUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  adminName?: string;
  adminEmail?: string;
  adminPassword?: string;
}

const jwtSecret = process.env.JWT_SECRET || "";

// Validate JWT_SECRET on startup
if (
  process.env.NODE_ENV === "production" ||
  process.env.VALIDATE_SECRETS === "true"
) {
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error(
      "Fatal: JWT_SECRET must be defined and at least 32 characters long",
    );
  }
  const disallowedPlaceholders = ["secret", "changeme", "jwtsecret", "password"];
  if (disallowedPlaceholders.some((ph) => jwtSecret.toLowerCase().includes(ph))) {
    throw new Error(
      "Fatal: Insecure placeholder detected in JWT_SECRET. Use a high-entropy secret.",
    );
  }
}

export const config: Config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  mongoUri:
    process.env.MONGODB_URI || "mongodb://localhost:27017/doctor_tracker",
  jwtSecret: jwtSecret || "dev-insecure-jwt-secret-min-32-chars-long-doctor-tracker-key",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
  adminName: process.env.ADMIN_NAME,
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
};
