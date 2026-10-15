import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db.config";

export interface ClinicSettingsAttributes {
  id: string;
  clinicName: string;
  address: string | null;
  phone: string | null;
  logoUrl: string | null;
  registrationNo: string | null;
  paperSize: "A4" | "A5" | "thermal";
  createdAt?: Date;
  updatedAt?: Date;
}

interface ClinicSettingsCreationAttributes
  extends Optional<ClinicSettingsAttributes, "id" | "createdAt" | "updatedAt" | "address" | "phone" | "logoUrl" | "registrationNo"> {}

class ClinicSettings
  extends Model<ClinicSettingsAttributes, ClinicSettingsCreationAttributes>
  implements ClinicSettingsAttributes
{
  public id!: string;
  public clinicName!: string;
  public address!: string | null;
  public phone!: string | null;
  public logoUrl!: string | null;
  public registrationNo!: string | null;
  public paperSize!: "A4" | "A5" | "thermal";
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ClinicSettings.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    clinicName: { type: DataTypes.STRING, allowNull: false, defaultValue: "My Clinic" },
    address: { type: DataTypes.TEXT, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    logoUrl: { type: DataTypes.TEXT, allowNull: true },
    registrationNo: { type: DataTypes.STRING, allowNull: true },
    paperSize: { type: DataTypes.ENUM("A4", "A5", "thermal"), allowNull: false, defaultValue: "A4" },
  },
  { sequelize, modelName: "ClinicSettings", tableName: "clinic_settings", timestamps: true }
);

export default ClinicSettings;
