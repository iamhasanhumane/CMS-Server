import { Request, Response } from "express";
import Visit from "../models/visit.model";
import Appointment from "../models/appointment.model";
import Patient from "../models/patient.model";
import Prescription from "../models/prescription.model";
import PrescriptionItem from "../models/prescriptionItem.model";
import Medicine from "../models/medicine.model";
import User from "../models/user.model";
import DoctorProfile from "../models/doctorProfile.model";
import VisitAttachment from "../models/visitAttachment.model";
import { logAudit } from "../services/audit.service";
import Responder from "../utils/responder";

export const createVisitController = async (req: Request, res: Response) => {
  try {
    const { appointmentId, vitals, symptomsNotes, diagnosisNotes, followUpDate } = req.body;

    const appointment = await Appointment.findByPk(appointmentId);
    if (!appointment) return Responder(res, { error: "Appointment not found", httpCode: 404 });

    // Check if visit already exists
    const existingVisit = await Visit.findOne({ where: { appointmentId } });
    if (existingVisit) {
      // Update existing
      await existingVisit.update({ vitals, symptomsNotes, diagnosisNotes, followUpDate });
      return Responder(res, { message: "Visit updated", data: { visit: existingVisit }, httpCode: 200 });
    }

    const visit = await Visit.create({
      appointmentId,
      patientId: appointment.patientId,
      doctorId: req.userId!,
      vitals,
      symptomsNotes,
      diagnosisNotes,
      followUpDate,
    });

    // Mark appointment as in_consultation
    await appointment.update({ status: "in_consultation" });

    await logAudit(req.userId!, "CREATE", "Visit", visit.id, `Consultation for appointment ${appointmentId}`);
    return Responder(res, { message: "Visit created", data: { visit }, httpCode: 201 });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const completeVisitController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { diagnosisNotes, symptomsNotes, vitals, followUpDate } = req.body;

    const visit = await Visit.findByPk(id);
    if (!visit) return Responder(res, { error: "Visit not found", httpCode: 404 });

    await visit.update({ diagnosisNotes, symptomsNotes, vitals, followUpDate });

    // Mark appointment as completed
    const appointment = await Appointment.findByPk(visit.appointmentId);
    if (appointment) await appointment.update({ status: "completed" });

    await logAudit(req.userId!, "UPDATE", "Visit", id, "Visit completed");
    return Responder(res, { message: "Visit completed", data: { visit }, httpCode: 200 });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

/** Save visit fields (vitals / notes / follow-up) WITHOUT completing the appointment */
export const saveVisitDraftController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { diagnosisNotes, symptomsNotes, vitals, followUpDate } = req.body;

    const visit = await Visit.findByPk(id);
    if (!visit) return Responder(res, { error: "Visit not found", httpCode: 404 });

    await visit.update({ diagnosisNotes, symptomsNotes, vitals, followUpDate });

    return Responder(res, { message: "Visit draft saved", data: { visit }, httpCode: 200 });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const getPatientHistoryController = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;

    const visits = await Visit.findAll({
      where: { patientId },
      include: [
        { model: Patient, as: "patient" },
        { model: Appointment, as: "appointment" },
        {
          model: Prescription, as: "prescription",
          include: [{ model: PrescriptionItem, as: "items", include: [{ model: Medicine, as: "medicine" }] }],
        },
        { model: User, as: "doctor", attributes: { exclude: ["password"] }, include: [{ model: DoctorProfile, as: "doctorProfile" }] },
        { model: VisitAttachment, as: "attachments" },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Attach best prescription when multiple exist for a visit
    const enriched = await Promise.all(
      visits.map(async (visit) => {
        const json = visit.toJSON() as any;
        const prescriptions = await Prescription.findAll({
          where: { visitId: visit.id },
          include: [
            { model: PrescriptionItem, as: "items", include: [{ model: Medicine, as: "medicine" }] },
          ],
          order: [["createdAt", "DESC"]],
        });
        json.prescription =
          prescriptions.find((p) => p.status === "finalized") ||
          prescriptions.find((p) => (p as any).items?.length > 0) ||
          prescriptions[0] ||
          json.prescription ||
          null;
        if (!json.attachments) {
          json.attachments = await VisitAttachment.findAll({
            where: { visitId: visit.id },
            order: [["createdAt", "ASC"]],
          });
        }
        return json;
      })
    );

    const patient = await Patient.findByPk(patientId);

    return Responder(res, { message: "Patient history fetched", data: { patient, visits: enriched }, httpCode: 200 });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const getVisitByAppointmentController = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.params;

    const visit = await Visit.findOne({
      where: { appointmentId },
      include: [
        { model: Patient, as: "patient" },
        { model: Appointment, as: "appointment" },
        {
          model: User,
          as: "doctor",
          attributes: { exclude: ["password"] },
          include: [{ model: DoctorProfile, as: "doctorProfile" }],
        },
      ],
    });

    if (!visit) {
      return Responder(res, { error: "No visit record found for this appointment", httpCode: 404 });
    }

    // Prefer finalized prescription (older drafts may exist without items)
    const prescriptions = await Prescription.findAll({
      where: { visitId: visit.id },
      include: [
        {
          model: PrescriptionItem,
          as: "items",
          include: [{ model: Medicine, as: "medicine" }],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const prescription =
      prescriptions.find((p) => p.status === "finalized") ||
      prescriptions.find((p) => (p as any).items?.length > 0) ||
      prescriptions[0] ||
      null;

    const payload = visit.toJSON() as any;
    payload.prescription = prescription;
    payload.attachments = await VisitAttachment.findAll({
      where: { visitId: visit.id },
      order: [["createdAt", "ASC"]],
    });

    return Responder(res, { message: "Visit fetched", data: { visit: payload }, httpCode: 200 });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};
