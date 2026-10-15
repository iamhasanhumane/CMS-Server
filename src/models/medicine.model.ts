import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db.config";

export type MedicineForm = "tablet" | "syrup" | "injection" | "capsule" | "cream" | "drops" | "inhaler" | "other";

export interface MedicineAttributes {
  id: string;
  name: string;
  genericName: string | null;
  rac?: string | null;
  form: MedicineForm;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MedicineCreationAttributes
  extends Optional<
    MedicineAttributes,
    "id" | "createdAt" | "updatedAt" | "genericName" | "rac" | "form" | "name"
  > {}

class Medicine
  extends Model<MedicineAttributes, MedicineCreationAttributes>
  implements MedicineAttributes
{
  public id!: string;
  public name!: string;
  public genericName!: string | null;
  public rac!: string | null;
  public form!: MedicineForm;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Medicine.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    genericName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rac: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    form: {
      type: DataTypes.ENUM("tablet", "syrup", "injection", "capsule", "cream", "drops", "inhaler", "other"),
      allowNull: false,
      defaultValue: "tablet",
    },
  },
  {
    sequelize,
    modelName: "Medicine",
    tableName: "medicines",
    timestamps: true,
  }
);

export default Medicine;
