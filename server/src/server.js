import app from "./app.js";
import { config } from "./config/index.js";
import { connectDB } from "./config/db.js";

const startServer = async () => {
  try {
    const server = app.listen(config.port, () => {
      console.log(`[Server] Doctor Tracker backend running in ${config.env} mode on port ${config.port}`);
      console.log(`[Server] Health check endpoint: http://localhost:${config.port}/api/v1/health`);
    });

    // Attempt MongoDB connection asynchronously so server starts immediately
    connectDB()
      .catch((dbErr) => {
        console.warn(`[Warning] Database connection failed on startup: ${dbErr.message}`);
        console.warn("[Tip] Ensure MongoDB is running or configure MONGODB_URI in .env");
      });

    const shutdown = (signal) => {
      console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log("[Server] HTTP server closed.");
        process.exit(0);
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error(`[Server Fatal Error] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
