import User from "./user.model";
import DoctorProfile from "./doctorProfile.model";
import StaffProfile from "./staffProfile.model";
import Patient from "./patient.model";
import Appointment from "./appointment.model";
import Visit from "./visit.model";
import Medicine from "./medicine.model";
import Prescription from "./prescription.model";
import PrescriptionItem from "./prescriptionItem.model";
import Bill from "./bill.model";
import BillItem from "./billItem.model";
import AuditLog from "./auditLog.model";
import VisitAttachment from "./visitAttachment.model";
import UploadToken from "./uploadToken.model";

// setup associations
export const setUpAssociations = () => {
  console.log("Setting up associations...");

  // User <-> DoctorProfile (1:1)
  User.hasOne(DoctorProfile, { foreignKey: "userId", as: "doctorProfile" });
  DoctorProfile.belongsTo(User, { foreignKey: "userId", as: "user" });

  // User <-> StaffProfile (1:1)
  User.hasOne(StaffProfile, { foreignKey: "userId", as: "staffProfile" });
  StaffProfile.belongsTo(User, { foreignKey: "userId", as: "user" });

  // Patient <-> Appointment (1:M)
  Patient.hasMany(Appointment, { foreignKey: "patientId", as: "appointments" });
  Appointment.belongsTo(Patient, { foreignKey: "patientId", as: "patient" });

  // User(doctor) <-> Appointment (1:M)
  User.hasMany(Appointment, { foreignKey: "doctorId", as: "doctorAppointments" });
  Appointment.belongsTo(User, { foreignKey: "doctorId", as: "doctor" });

  // User(staff) <-> Appointment bookedBy
  Appointment.belongsTo(User, { foreignKey: "bookedBy", as: "booker" });

  // Appointment <-> Visit (1:1)
  Appointment.hasOne(Visit, { foreignKey: "appointmentId", as: "visit" });
  Visit.belongsTo(Appointment, { foreignKey: "appointmentId", as: "appointment" });

  // Patient <-> Visit (1:M)
  Patient.hasMany(Visit, { foreignKey: "patientId", as: "visits" });
  Visit.belongsTo(Patient, { foreignKey: "patientId", as: "patient" });

  // User(doctor) <-> Visit (1:M)
  User.hasMany(Visit, { foreignKey: "doctorId", as: "doctorVisits" });
  Visit.belongsTo(User, { foreignKey: "doctorId", as: "doctor" });

  // Visit <-> Prescription (1:1)
  Visit.hasOne(Prescription, { foreignKey: "visitId", as: "prescription" });
  Prescription.belongsTo(Visit, { foreignKey: "visitId", as: "visit" });

  // Patient <-> Prescription (1:M)
  Patient.hasMany(Prescription, { foreignKey: "patientId", as: "prescriptions" });
  Prescription.belongsTo(Patient, { foreignKey: "patientId", as: "patient" });

  // User(doctor) <-> Prescription (1:M)
  Prescription.belongsTo(User, { foreignKey: "doctorId", as: "doctor" });

  // Prescription <-> PrescriptionItem (1:M)
  Prescription.hasMany(PrescriptionItem, { foreignKey: "prescriptionId", as: "items" });
  PrescriptionItem.belongsTo(Prescription, { foreignKey: "prescriptionId", as: "prescription" });

  // Medicine <-> PrescriptionItem (1:M)
  Medicine.hasMany(PrescriptionItem, { foreignKey: "medicineId", as: "prescriptionItems" });
  PrescriptionItem.belongsTo(Medicine, { foreignKey: "medicineId", as: "medicine" });

  // Prescription <-> Bill (1:1)
  Prescription.hasOne(Bill, { foreignKey: "prescriptionId", as: "bill" });
  Bill.belongsTo(Prescription, { foreignKey: "prescriptionId", as: "prescription" });

  // Patient <-> Bill (1:M)
  Patient.hasMany(Bill, { foreignKey: "patientId", as: "bills" });
  Bill.belongsTo(Patient, { foreignKey: "patientId", as: "patient" });

  // User(staff) <-> Bill billedBy
  Bill.belongsTo(User, { foreignKey: "billedBy", as: "biller" });

  // Bill <-> BillItem (1:M)
  Bill.hasMany(BillItem, { foreignKey: "billId", as: "items" });
  BillItem.belongsTo(Bill, { foreignKey: "billId", as: "bill" });

  // Medicine <-> BillItem (1:M)
  Medicine.hasMany(BillItem, { foreignKey: "medicineId", as: "billItems" });
  BillItem.belongsTo(Medicine, { foreignKey: "medicineId", as: "medicine" });

  // AuditLog -> User
  AuditLog.belongsTo(User, { foreignKey: "userId", as: "user" });

  // Visit <-> VisitAttachment (1:M)
  Visit.hasMany(VisitAttachment, { foreignKey: "visitId", as: "attachments" });
  VisitAttachment.belongsTo(Visit, { foreignKey: "visitId", as: "visit" });
  VisitAttachment.belongsTo(User, { foreignKey: "uploadedBy", as: "uploader" });

  // Visit <-> UploadToken (1:M)
  Visit.hasMany(UploadToken, { foreignKey: "visitId", as: "uploadTokens" });
  UploadToken.belongsTo(Visit, { foreignKey: "visitId", as: "visit" });

  console.log("Associations set up successfully!");
};
