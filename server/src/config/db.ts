import mongoose from 'mongoose';
import { config } from './index.js';

export const connectDB = async (): Promise<typeof mongoose> => {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown connection error';
    console.error(`[Database Error] Connection failed: ${message}`);
    throw error;
  }
};
