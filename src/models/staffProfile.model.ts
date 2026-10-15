import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db.config";

export interface StaffProfileAttributes {
  id: string;
  userId: string;
  designation: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface StaffProfileCreationAttributes
  extends Optional<StaffProfileAttributes, "id" | "createdAt" | "updatedAt" | "designation"> {}

class StaffProfile
  extends Model<StaffProfileAttributes, StaffProfileCreationAttributes>
  implements StaffProfileAttributes
{
  public id!: string;
  public userId!: string;
  public designation!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

StaffProfile.init(
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
    designation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "StaffProfile",
    tableName: "staff_profiles",
    timestamps: true,
  }
);

export default StaffProfile;
