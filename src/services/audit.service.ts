import AuditLog from "../models/auditLog.model";

export const logAudit = async (
  userId: string,
  action: string,
  entityType: string,
  entityId?: string | null,
  details?: string | null
) => {
  try {
    await AuditLog.create({
      userId,
      action,
      entityType,
      entityId: entityId || null,
      details: details || null,
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
};
