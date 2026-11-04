import dotenv from "dotenv";

dotenv.config();

export interface Config {
  env: string;
  port: number;
  clientUrl: string;
  mongoUri: string;
}

export const config: Config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  mongoUri:
    process.env.MONGODB_URI || "mongodb://localhost:27017/doctor_tracker",
};
