import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db.config";

export type PaymentMode = "cash" | "card" | "upi";

export interface BillAttributes {
  id: string;
  prescriptionId: string | null;
  patientId: string;
  billedBy: string;
  consultationFee: number;
  discount: number;
  totalAmount: number;
  paymentMode: PaymentMode;
  printedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface BillCreationAttributes
  extends Optional<BillAttributes, "id" | "createdAt" | "updatedAt" | "discount" | "printedAt" | "prescriptionId"> {}

class Bill
  extends Model<BillAttributes, BillCreationAttributes>
  implements BillAttributes
{
  public id!: string;
  public prescriptionId!: string | null;
  public patientId!: string;
  public billedBy!: string;
  public consultationFee!: number;
  public discount!: number;
  public totalAmount!: number;
  public paymentMode!: PaymentMode;
  public printedAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public items?: any[];
  public patient?: any;
}

Bill.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    prescriptionId: { type: DataTypes.UUID, allowNull: true, references: { model: "prescriptions", key: "id" } },
    patientId: { type: DataTypes.UUID, allowNull: false, references: { model: "patients", key: "id" } },
    billedBy: { type: DataTypes.UUID, allowNull: false, references: { model: "users", key: "id" } },
    consultationFee: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    discount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    paymentMode: { type: DataTypes.ENUM("cash", "card", "upi"), allowNull: false, defaultValue: "cash" },
    printedAt: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, modelName: "Bill", tableName: "bills", timestamps: true }
);

export default Bill;
