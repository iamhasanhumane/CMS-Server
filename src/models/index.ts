import Appointment from "./appointment.model";
import AuditLog from "./auditLog.model";
import Bill from "./bill.model";
import BillItem from "./billItem.model";
import ClinicSettings from "./clinicSettings.model";
import DoctorProfile from "./doctorProfile.model";
import Medicine from "./medicine.model";
import Patient from "./patient.model";
import Prescription from "./prescription.model";
import PrescriptionItem from "./prescriptionItem.model";
import StaffProfile from "./staffProfile.model";
import User from "./user.model";
import Visit from "./visit.model";
import VisitAttachment from "./visitAttachment.model";
import UploadToken from "./uploadToken.model";

export const syncModels = async () => {
  // Sync in dependency order
  await User.sync({ alter: true });
  await DoctorProfile.sync({ alter: true });
  await StaffProfile.sync({ alter: true });
  await Patient.sync({ alter: true });
  await Appointment.sync({ alter: true });
  await Visit.sync({ alter: true });
  await Medicine.sync({ alter: true });
  await Prescription.sync({ alter: true });
  await PrescriptionItem.sync({ alter: true });
  await Bill.sync({ alter: true });
  await BillItem.sync({ alter: true });
  await AuditLog.sync({ alter: true });
  await ClinicSettings.sync({ alter: true });
  await VisitAttachment.sync({ alter: true });
  await UploadToken.sync({ alter: true });

  console.log("✅ All models synced successfully");
};

export {
  Appointment, AuditLog, Bill,
  BillItem, ClinicSettings, DoctorProfile, Medicine, Patient, Prescription,
  PrescriptionItem, StaffProfile, User, Visit, VisitAttachment, UploadToken
};

