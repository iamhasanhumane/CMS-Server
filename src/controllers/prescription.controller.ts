import { Request, Response } from "express";
import Prescription from "../models/prescription.model";
import PrescriptionItem from "../models/prescriptionItem.model";
import Medicine from "../models/medicine.model";
import Visit from "../models/visit.model";
import Patient from "../models/patient.model";
import User from "../models/user.model";
import DoctorProfile from "../models/doctorProfile.model";
import { logAudit } from "../services/audit.service";
import Responder from "../utils/responder";

export const createPrescriptionController = async (req: Request, res: Response) => {
  try {
    const { visitId, patientId, items, adviceNotes, followUpDate, template } = req.body;

    const prescription = await Prescription.create({
      visitId,
      doctorId: req.userId!,
      patientId,
      status: "draft",
      adviceNotes: adviceNotes || null,
      followUpDate: followUpDate || null,
      template: template || "tamil",
    });

    if (items && items.length > 0) {
      const prescItems = items.map((item: any) => ({
        prescriptionId: prescription.id,
        medicineId: item.medicineId,
        dosage: item.dosage,
        frequency: item.frequency,
        durationDays: item.durationDays,
        timing: item.timing || "after_food",
        instructions: item.instructions,
      }));
      await PrescriptionItem.bulkCreate(prescItems);
    }

    await logAudit(req.userId!, "CREATE", "Prescription", prescription.id, `Prescription for visit ${visitId}`);

    const full = await Prescription.findByPk(prescription.id, {
      include: [{ model: PrescriptionItem, as: "items", include: [{ model: Medicine, as: "medicine" }] }],
    });

    return Responder(res, { message: "Prescription created", data: { prescription: full }, httpCode: 201 });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const updatePrescriptionController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { items, adviceNotes, followUpDate, template } = req.body;

    const prescription = await Prescription.findByPk(id);
    if (!prescription) return Responder(res, { error: "Prescription not found", httpCode: 404 });
    if (prescription.status === "finalized") return Responder(res, { error: "Cannot edit finalized prescription", httpCode: 400 });

    // Update prescription fields
    await prescription.update({
      adviceNotes: adviceNotes !== undefined ? adviceNotes : prescription.adviceNotes,
      followUpDate: followUpDate !== undefined ? followUpDate : prescription.followUpDate,
      template: template !== undefined ? template : prescription.template,
    });

    // Replace items
    await PrescriptionItem.destroy({ where: { prescriptionId: id } });
    if (items && items.length > 0) {
      const prescItems = items.map((item: any) => ({
        prescriptionId: id,
        medicineId: item.medicineId,
        dosage: item.dosage,
        frequency: item.frequency,
        durationDays: item.durationDays,
        timing: item.timing || "after_food",
        instructions: item.instructions,
      }));
      await PrescriptionItem.bulkCreate(prescItems);
    }

    const full = await Prescription.findByPk(id, {
      include: [{ model: PrescriptionItem, as: "items", include: [{ model: Medicine, as: "medicine" }] }],
    });

    return Responder(res, { message: "Prescription updated", data: { prescription: full }, httpCode: 200 });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const finalizePrescriptionController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const prescription = await Prescription.findByPk(id);
    if (!prescription) return Responder(res, { error: "Prescription not found", httpCode: 404 });

    await prescription.update({ status: "finalized", printedAt: new Date() });
    await logAudit(req.userId!, "FINALIZE", "Prescription", id, "Prescription finalized");

    return Responder(res, { message: "Prescription finalized", data: { prescription }, httpCode: 200 });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const getPrescriptionController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const prescription = await Prescription.findByPk(id, {
      include: [
        { model: PrescriptionItem, as: "items", include: [{ model: Medicine, as: "medicine" }] },
        { model: Patient, as: "patient" },
        { model: User, as: "doctor", attributes: { exclude: ["password"] }, include: [{ model: DoctorProfile, as: "doctorProfile" }] },
        { model: Visit, as: "visit" },
      ],
    });
    if (!prescription) return Responder(res, { error: "Prescription not found", httpCode: 404 });
    return Responder(res, { message: "Prescription fetched", data: { prescription }, httpCode: 200 });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const getPrescriptionByVisitController = async (req: Request, res: Response) => {
  try {
    const { visitId } = req.params;
    const prescription = await Prescription.findOne({
      where: { visitId },
      include: [
        { model: PrescriptionItem, as: "items", include: [{ model: Medicine, as: "medicine" }] },
        { model: Patient, as: "patient" },
        { model: User, as: "doctor", attributes: { exclude: ["password"] }, include: [{ model: DoctorProfile, as: "doctorProfile" }] },
      ],
    });
    return Responder(res, { message: "Prescription fetched", data: { prescription }, httpCode: 200 });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};
