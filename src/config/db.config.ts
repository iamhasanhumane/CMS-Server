import dotenv from "dotenv";
import path from "path";
import pg from "pg";
import { Sequelize } from "sequelize";

if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
}

// db.config.ts
const getSslConfig = () => {
  const isLocalDb = process.env.DB_SSL === "false" || process.env.NODE_ENV !== "production"
  if (process.env.NODE_ENV === "production" && !isLocalDb) {
    return {
      require: true,
      rejectUnauthorized: false,
    }
  }
  return false
}

const connectionString = process.env.DATABASE_URL as string;

if (!connectionString) {
  throw new Error("Database connection string is missing");
}

const sequelize = new Sequelize(connectionString, {
  dialect: "postgres",
  dialectModule: pg,
  logging: false,
  dialectOptions: {
    ssl: getSslConfig(),
  },
});

export default sequelize;
