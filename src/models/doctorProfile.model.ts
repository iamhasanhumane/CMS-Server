import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db.config";

export interface DoctorProfileAttributes {
  id: string;
  userId: string;
  specialization: string;
  qualification: string;
  registrationNo: string;
  signatureImageUrl: string | null;
  consultationFee: number;
  workingDays: string; // JSON string e.g. '["Monday","Tuesday"]'
  workingHours: string; // e.g. "09:00-17:00"
  createdAt?: Date;
  updatedAt?: Date;
}

interface DoctorProfileCreationAttributes
  extends Optional<DoctorProfileAttributes, "id" | "createdAt" | "updatedAt" | "signatureImageUrl"> {}

class DoctorProfile
  extends Model<DoctorProfileAttributes, DoctorProfileCreationAttributes>
  implements DoctorProfileAttributes
{
  public id!: string;
  public userId!: string;
  public specialization!: string;
  public qualification!: string;
  public registrationNo!: string;
  public signatureImageUrl!: string | null;
  public consultationFee!: number;
  public workingDays!: string;
  public workingHours!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

DoctorProfile.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: { model: "users", key: "id" },
    },
    specialization: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    qualification: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    registrationNo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    signatureImageUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    consultationFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    workingDays: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]',
    },
    workingHours: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "09:00-17:00",
    },
  },
  {
    sequelize,
    modelName: "DoctorProfile",
    tableName: "doctor_profiles",
    timestamps: true,
  }
);

export default DoctorProfile;
