import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db.config";

export interface AuditLogAttributes {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  timestamp?: Date;
}

interface AuditLogCreationAttributes
  extends Optional<AuditLogAttributes, "id" | "timestamp" | "entityId" | "details"> {}

class AuditLog
  extends Model<AuditLogAttributes, AuditLogCreationAttributes>
  implements AuditLogAttributes
{
  public id!: string;
  public userId!: string;
  public action!: string;
  public entityType!: string;
  public entityId!: string | null;
  public details!: string | null;
  public readonly timestamp!: Date;
  public user?: any;
}

AuditLog.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, references: { model: "users", key: "id" } },
    action: { type: DataTypes.STRING, allowNull: false },
    entityType: { type: DataTypes.STRING, allowNull: false },
    entityId: { type: DataTypes.UUID, allowNull: true },
    details: { type: DataTypes.TEXT, allowNull: true },
    timestamp: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  { sequelize, modelName: "AuditLog", tableName: "audit_logs", timestamps: false }
);

export default AuditLog;
