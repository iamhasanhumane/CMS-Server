import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/db.config";

export interface VisitAttachmentAttributes {
  id: string;
  visitId: string;
  fileUrl: string;
  caption: string | null;
  uploadedBy: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface VisitAttachmentCreationAttributes
  extends Optional<
    VisitAttachmentAttributes,
    "id" | "createdAt" | "updatedAt" | "caption" | "uploadedBy"
  > {}

class VisitAttachment
  extends Model<VisitAttachmentAttributes, VisitAttachmentCreationAttributes>
  implements VisitAttachmentAttributes
{
  public id!: string;
  public visitId!: string;
  public fileUrl!: string;
  public caption!: string | null;
  public uploadedBy!: string | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

VisitAttachment.init(
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
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    caption: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    uploadedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
  },
  {
    sequelize,
    modelName: "VisitAttachment",
    tableName: "visit_attachments",
    timestamps: true,
  }
);

export default VisitAttachment;
