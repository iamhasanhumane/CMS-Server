import sequelize from "../config/db.config";
import { syncModels } from "../models";
import { setUpAssociations } from "../models/assosciations";
import { seedAdminUser } from "../scripts/seedAdmin";
import { seedClinicSettings } from "../scripts/seedClinicSettings";

let isInitialized = false;
let initializationPromise: Promise<void> | null = null;
let associationsInitialized = false;

export const initializeDatabase = () => {
  if (isInitialized) return Promise.resolve();

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      await sequelize.authenticate();
      console.log(
        "✅ Connection to the database has been established successfully"
      );

      if (!associationsInitialized) {
        setUpAssociations();
        associationsInitialized = true;
      }

      await syncModels();

      // Seed default data
      await seedAdminUser();
      await seedClinicSettings();

      isInitialized = true;
    } catch (err) {
      console.error("❌ DB Connection failed:", err);
      initializationPromise = null;
      throw err;
    }
  })();

  return initializationPromise;
};
