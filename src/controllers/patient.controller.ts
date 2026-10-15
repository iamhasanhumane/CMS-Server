import { Request, Response } from "express";
import Patient from "../models/patient.model";
import Appointment from "../models/appointment.model";
import { Op } from "sequelize";
import { logAudit } from "../services/audit.service";
import Responder from "../utils/responder";
import sequelize from "../config/db.config";

const getNextToken = async (doctorId: string, date: string): Promise<number> => {
  const lastAppt = await Appointment.findOne({
    where: { doctorId, appointmentDate: date },
    order: [["tokenNumber", "DESC"]],
  });
  return (lastAppt?.tokenNumber || 0) + 1;
};

export const createPatientController = async (req: Request, res: Response) => {
  const t = await sequelize.transaction();
  try {
    const { name, age, dob, sex, phone, address, allergiesNotes, chronicConditions, doctorId, appointmentDate } = req.body;

    const result = await Patient.findOne({ order: [["createdAt", "DESC"]], transaction: t });
    const lastNum = result?.uhid ? parseInt(result.uhid.replace("PT", ""), 10) : 0;
    const uhid = `PT${String(lastNum + 1).padStart(5, "0")}`;

    const patient = await Patient.create({
      uhid, name, age, dob, sex, phone, address, allergiesNotes, chronicConditions,
    }, { transaction: t });

    let appointment = null;
    if (doctorId) {
      const date = appointmentDate || new Date().toISOString().split("T")[0];
      const tokenNumber = await getNextToken(doctorId, date);
      appointment = await Appointment.create({
        patientId: patient.id,
        doctorId,
        tokenNumber,
        appointmentDate: date,
        bookedBy: req.userId!,
        status: "waiting",
      }, { transaction: t });
    }

    await t.commit();

    await logAudit(req.userId!, "CREATE", "Patient", patient.id, `Registered patient: ${name} (${uhid})`);
    if (appointment) {
      await logAudit(req.userId!, "CREATE", "Appointment", appointment.id, `Token #${appointment.tokenNumber} on registration`);
    }

    return Responder(res, {
      message: appointment ? "Patient registered and token assigned" : "Patient registered",
      data: { patient, appointment },
      httpCode: 201,
    });
  } catch (error: any) {
    await t.rollback();
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

import Visit from "../models/visit.model";

export const getPatientsController = async (req: Request, res: Response) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { uhid: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { rows: patients, count } = await Patient.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: Number(limit),
      offset,
    });

    const enrichedPatients = await Promise.all(
      patients.map(async (pat) => {
        const visitCount = await Visit.count({ where: { patientId: pat.id } });
        return {
          ...pat.toJSON(),
          visitCount,
        };
      })
    );

    return Responder(res, {
      message: "Patients fetched",
      data: { patients: enrichedPatients, total: count, page: Number(page), totalPages: Math.ceil(count / Number(limit)) },
      httpCode: 200,
    });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const getPatientByIdController = async (req: Request, res: Response) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) return Responder(res, { error: "Patient not found", httpCode: 404 });
    return Responder(res, { message: "Patient fetched", data: { patient }, httpCode: 200 });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const updatePatientController = async (req: Request, res: Response) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) return Responder(res, { error: "Patient not found", httpCode: 404 });

    const { name, age, dob, sex, phone, address, allergiesNotes, chronicConditions } = req.body;
    await patient.update({ name, age, dob, sex, phone, address, allergiesNotes, chronicConditions });

    await logAudit(req.userId!, "UPDATE", "Patient", patient.id, `Updated patient: ${patient.name}`);
    return Responder(res, { message: "Patient updated", data: { patient }, httpCode: 200 });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const deletePatientController = async (req: Request, res: Response) => {
  try {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) return Responder(res, { error: "Patient not found", httpCode: 404 });

    const name = patient.name;
    const uhid = patient.uhid;
    await patient.destroy();

    await logAudit(req.userId!, "DELETE", "Patient", req.params.id, `Deleted patient: ${name} (${uhid})`);
    return Responder(res, { message: "Patient deleted", httpCode: 200 });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

