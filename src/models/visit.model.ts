import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db.config";

export interface VitalsData {
  bp: string | null;
  weight: string | null;
  temperature: string | null;
  pulse: string | null;
  spo2: string | null;
}

export interface VisitAttributes {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  vitals: VitalsData | null;
  symptomsNotes: string | null;
  diagnosisNotes: string | null;
  followUpDate: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface VisitCreationAttributes
  extends Optional<VisitAttributes, "id" | "createdAt" | "updatedAt" | "vitals" | "symptomsNotes" | "diagnosisNotes" | "followUpDate"> {}

class Visit
  extends Model<VisitAttributes, VisitCreationAttributes>
  implements VisitAttributes
{
  public id!: string;
  public appointmentId!: string;
  public patientId!: string;
  public doctorId!: string;
  public vitals!: VitalsData | null;
  public symptomsNotes!: string | null;
  public diagnosisNotes!: string | null;
  public followUpDate!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association properties
  public patient?: any;
  public doctor?: any;
  public appointment?: any;
  public prescription?: any;
}

Visit.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    appointmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "appointments", key: "id" },
    },
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "patients", key: "id" },
    },
    doctorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    vitals: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    symptomsNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    diagnosisNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    followUpDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Visit",
    tableName: "visits",
    timestamps: true,
  }
);

export default Visit;
