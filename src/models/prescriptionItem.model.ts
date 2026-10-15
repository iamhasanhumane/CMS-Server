import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db.config";

export type MedicineTiming = "before_food" | "after_food" | "with_food" | "empty_stomach";

export interface PrescriptionItemAttributes {
  id: string;
  prescriptionId: string;
  medicineId: string;
  dosage: string;
  frequency: string; // e.g. "1-0-1"
  durationDays: number;
  timing: MedicineTiming;
  instructions: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PrescriptionItemCreationAttributes
  extends Optional<PrescriptionItemAttributes, "id" | "createdAt" | "updatedAt" | "instructions" | "timing"> {}

class PrescriptionItem
  extends Model<PrescriptionItemAttributes, PrescriptionItemCreationAttributes>
  implements PrescriptionItemAttributes
{
  public id!: string;
  public prescriptionId!: string;
  public medicineId!: string;
  public dosage!: string;
  public frequency!: string;
  public durationDays!: number;
  public timing!: MedicineTiming;
  public instructions!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association
  public medicine?: any;
}

PrescriptionItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    prescriptionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "prescriptions", key: "id" },
    },
    medicineId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "medicines", key: "id" },
    },
    dosage: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    frequency: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    durationDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    timing: {
      type: DataTypes.ENUM("before_food", "after_food", "with_food", "empty_stomach"),
      allowNull: false,
      defaultValue: "after_food",
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "PrescriptionItem",
    tableName: "prescription_items",
    timestamps: true,
  }
);

export default PrescriptionItem;
