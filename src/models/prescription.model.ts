import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db.config";

export type PrescriptionStatus = "draft" | "finalized";

export interface PrescriptionAttributes {
  id: string;
  visitId: string;
  doctorId: string;
  patientId: string;
  status: PrescriptionStatus;
  adviceNotes: string | null;
  followUpDate: string | null;
  template: string | null;
  printedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PrescriptionCreationAttributes
  extends Optional<PrescriptionAttributes, "id" | "createdAt" | "updatedAt" | "status" | "printedAt" | "adviceNotes" | "followUpDate" | "template"> {}

class Prescription
  extends Model<PrescriptionAttributes, PrescriptionCreationAttributes>
  implements PrescriptionAttributes
{
  public id!: string;
  public visitId!: string;
  public doctorId!: string;
  public patientId!: string;
  public status!: PrescriptionStatus;
  public adviceNotes!: string | null;
  public followUpDate!: string | null;
  public template!: string | null;
  public printedAt!: Date | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association properties
  public items?: any[];
  public patient?: any;
  public doctor?: any;
  public visit?: any;
}

Prescription.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    visitId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "visits", key: "id" },
    },
    doctorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    patientId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "patients", key: "id" },
    },
    status: {
      type: DataTypes.ENUM("draft", "finalized"),
      allowNull: false,
      defaultValue: "draft",
    },
    adviceNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    followUpDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    template: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "tamil",
    },
    printedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Prescription",
    tableName: "prescriptions",
    timestamps: true,
  }
);

export default Prescription;
