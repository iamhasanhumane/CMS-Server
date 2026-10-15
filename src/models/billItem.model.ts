import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db.config";

export interface BillItemAttributes {
  id: string;
  billId: string;
  medicineId: string;
  quantity: number;
  rate: number;
  amount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface BillItemCreationAttributes
  extends Optional<BillItemAttributes, "id" | "createdAt" | "updatedAt"> {}

class BillItem
  extends Model<BillItemAttributes, BillItemCreationAttributes>
  implements BillItemAttributes
{
  public id!: string;
  public billId!: string;
  public medicineId!: string;
  public quantity!: number;
  public rate!: number;
  public amount!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public medicine?: any;
}

BillItem.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    billId: { type: DataTypes.UUID, allowNull: false, references: { model: "bills", key: "id" } },
    medicineId: { type: DataTypes.UUID, allowNull: false, references: { model: "medicines", key: "id" } },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    rate: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  },
  { sequelize, modelName: "BillItem", tableName: "bill_items", timestamps: true }
);

export default BillItem;
