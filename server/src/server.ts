import http from "node:http";
import app from "./app.js";
import { config } from "./config/index.js";
import { connectDB } from "./config/db.js";

const startServer = async (): Promise<void> => {
  try {
    const server: http.Server = app.listen(config.port, () => {
      console.log(
        `[Server] Doctor Tracker backend running in ${config.env} mode on port ${config.port}`,
      );
      console.log(
        `[Server] Health check endpoint: http://localhost:${config.port}/api/v1/health`,
      );
    });

    // Attempt MongoDB connection asynchronously so server starts immediately
    connectDB().catch((dbErr: unknown) => {
      const message =
        dbErr instanceof Error ? dbErr.message : "Unknown database error";
      console.warn(
        `[Warning] Database connection failed on startup: ${message}`,
      );
      console.warn(
        "[Tip] Ensure MongoDB is running or configure MONGODB_URI in .env",
      );
    });

    const shutdown = (signal: NodeJS.Signals): void => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log("[Server] HTTP server closed.");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown startup error";
    console.error(`[Server Fatal Error] Failed to start server: ${message}`);
    process.exit(1);
  }
};

startServer();
