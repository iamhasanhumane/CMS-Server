import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db.config";

export type AppointmentStatus = "waiting" | "in_consultation" | "completed" | "cancelled";

export interface AppointmentAttributes {
  id: string;
  patientId: string;
  doctorId: string;
  tokenNumber: number;
  appointmentDate: string; // DATEONLY
  status: AppointmentStatus;
  bookedBy: string; // staff user id
  feeCollected: boolean;
  feeCollectedAt: Date | null;
  dressingFee: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AppointmentCreationAttributes
  extends Optional<
    AppointmentAttributes,
    "id" | "createdAt" | "updatedAt" | "status" | "feeCollected" | "feeCollectedAt" | "dressingFee"
  > {}

class Appointment
  extends Model<AppointmentAttributes, AppointmentCreationAttributes>
  implements AppointmentAttributes
{
  public id!: string;
  public patientId!: string;
  public doctorId!: string;
  public tokenNumber!: number;
  public appointmentDate!: string;
  public status!: AppointmentStatus;
  public bookedBy!: string;
  public feeCollected!: boolean;
  public feeCollectedAt!: Date | null;
  public dressingFee!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Association properties
  public patient?: any;
  public doctor?: any;
  public booker?: any;
}

Appointment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    tokenNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    appointmentDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("waiting", "in_consultation", "completed", "cancelled"),
      allowNull: false,
      defaultValue: "waiting",
    },
    bookedBy: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    feeCollected: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    feeCollectedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    dressingFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: "Appointment",
    tableName: "appointments",
    timestamps: true,
  }
);

export default Appointment;
