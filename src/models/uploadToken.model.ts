import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db.config";

export interface UploadTokenAttributes {
  id: string;
  visitId: string;
  token: string;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UploadTokenCreationAttributes
  extends Optional<UploadTokenAttributes, "id" | "createdAt" | "updatedAt"> {}

class UploadToken
  extends Model<UploadTokenAttributes, UploadTokenCreationAttributes>
  implements UploadTokenAttributes
{
  public id!: string;
  public visitId!: string;
  public token!: string;
  public expiresAt!: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UploadToken.init(
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
    token: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "UploadToken",
    tableName: "upload_tokens",
    timestamps: true,
  }
);

export default UploadToken;
