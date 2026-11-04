import mongoose from "mongoose";
import { config } from "../config/index.js";
import { Admin } from "../models/admin.model.js";
import { hashPassword } from "../utils/password.util.js";

/**
 * Idempotent Admin Seeding Script
 * Run with: pnpm seed:admin
 */
async function seedAdmin(): Promise<void> {
  const name = config.adminName;
  const email = config.adminEmail?.trim().toLowerCase();
  const password = config.adminPassword;

  if (!name || !email || !password) {
    console.error(
      "Error: ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be configured in environment variables.",
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("Error: ADMIN_PASSWORD must be at least 8 characters long.");
    process.exit(1);
  }

  if (Buffer.byteLength(password, "utf8") > 72) {
    console.error("Error: ADMIN_PASSWORD cannot exceed 72 bytes.");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(config.mongoUri);
    console.log("Connected to MongoDB.");

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log(`Admin account with email "${email}" already exists. Skipping.`);
      await mongoose.disconnect();
      process.exit(0);
    }

    const passwordHash = await hashPassword(password);

    await Admin.create({
      name,
      email,
      passwordHash,
    });

    console.log(`Admin user "${email}" created successfully.`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error: unknown) {
    // Gracefully handle E11000 duplicate key error in case of concurrent executions
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: number }).code === 11000
    ) {
      console.log(`Admin account with email "${email}" already provisioned. Skipping.`);
      await mongoose.disconnect();
      process.exit(0);
    }

    console.error("Failed to seed admin user:", error instanceof Error ? error.message : error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedAdmin();

