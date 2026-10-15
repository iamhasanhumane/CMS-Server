import app from "./app";
import config from "./config/constants";
import { initializeDatabase } from "./utils/bootstrap";

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

// Standalone execution check: start listening when run as a standalone server
// (both local dev, Electron child_process, or node dist/server.js production server)
const isVercel = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
const isMainModule = require.main === module;

if (!isVercel || isMainModule) {
  initializeDatabase()
    .then(() => {
      app.listen(config.port, () => {
        console.log(`🚀 Server running on port ${config.port}`);
      });
    })
    .catch((err) => {
      console.error("❌ Database initialization / server startup failed:", err);
      process.exit(1);
    });
}

// Export for Vercel serverless / module import
export default app;