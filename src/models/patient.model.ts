import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db.config";

export interface PatientAttributes {
  id: string;
  uhid: string;
  name: string;
  age: number | null;
  dob: Date | null;
  sex: "male" | "female" | "other";
  phone: string | null;
  address: string | null;
  allergiesNotes: string | null;
  chronicConditions: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PatientCreationAttributes
  extends Optional<
    PatientAttributes,
    "id" | "createdAt" | "updatedAt" | "uhid" | "age" | "dob" | "phone" | "address" | "allergiesNotes" | "chronicConditions"
  > {}

class Patient
  extends Model<PatientAttributes, PatientCreationAttributes>
  implements PatientAttributes
{
  public id!: string;
  public uhid!: string;
  public name!: string;
  public age!: number | null;
  public dob!: Date | null;
  public sex!: "male" | "female" | "other";
  public phone!: string | null;
  public address!: string | null;
  public allergiesNotes!: string | null;
  public chronicConditions!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Patient.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    uhid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    dob: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    sex: {
      type: DataTypes.ENUM("male", "female", "other"),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    allergiesNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    chronicConditions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Patient",
    tableName: "patients",
    timestamps: true,
  }
);

export default Patient;
