import { Request, Response } from "express";
import Appointment from "../models/appointment.model";
import Patient from "../models/patient.model";
import User from "../models/user.model";
import DoctorProfile from "../models/doctorProfile.model";
import Visit from "../models/visit.model";
import { Op } from "sequelize";
import { logAudit } from "../services/audit.service";
import Responder from "../utils/responder";

const getNextToken = async (doctorId: string, date: string): Promise<number> => {
  const lastAppt = await Appointment.findOne({
    where: { doctorId, appointmentDate: date },
    order: [["tokenNumber", "DESC"]],
  });
  return (lastAppt?.tokenNumber || 0) + 1;
};

export const createAppointmentController = async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, appointmentDate } = req.body;
    const date = appointmentDate || new Date().toISOString().split("T")[0];
    const tokenNumber = await getNextToken(doctorId, date);

    const appointment = await Appointment.create({
      patientId, doctorId, tokenNumber, appointmentDate: date, bookedBy: req.userId!, status: "waiting",
    });

    await logAudit(req.userId!, "CREATE", "Appointment", appointment.id, `Token #${tokenNumber} for date ${date}`);

    const fullAppt = await Appointment.findByPk(appointment.id, {
      include: [
        { model: Patient, as: "patient" },
        { model: User, as: "doctor", attributes: { exclude: ["password"] } },
      ],
    });

    return Responder(res, { message: "Appointment booked", data: { appointment: fullAppt }, httpCode: 201 });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const getAppointmentsController = async (req: Request, res: Response) => {
  try {
    const { date, doctorId, status, allDates, startDate, endDate } = req.query;
    const where: any = {};

    if (startDate && endDate) {
      where.appointmentDate = {
        [Op.between]: [startDate as string, endDate as string]
      };
    } else if (date) {
      where.appointmentDate = date;
    } else if (allDates === "true" || (allDates as any) === true) {
      // Don't restrict to today's date
    } else {
      where.appointmentDate = new Date().toISOString().split("T")[0];
    }

    if (doctorId) where.doctorId = doctorId;
    if (status) where.status = status;

    // If role is doctor, only show their appointments
    if (req.userRole === "doctor") {
      where.doctorId = req.userId;
    }

    const appointments = await Appointment.findAll({
      where,
      include: [
        { model: Patient, as: "patient" },
        { model: User, as: "doctor", attributes: { exclude: ["password"] }, include: [{ model: DoctorProfile, as: "doctorProfile" }] },
        { model: Visit, as: "visit" }
      ],
      order: [["tokenNumber", "ASC"]],
    });

    return Responder(res, { message: "Appointments fetched", data: { appointments }, httpCode: 200 });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const updateAppointmentStatusController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const appointment = await Appointment.findByPk(id);
    if (!appointment) return Responder(res, { error: "Appointment not found", httpCode: 404 });

    await appointment.update({ status });
    await logAudit(req.userId!, "UPDATE", "Appointment", id, `Status changed to ${status}`);

    return Responder(res, { message: "Appointment updated", data: { appointment }, httpCode: 200 });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

/** Staff marks consultation / dressing fees for a completed visit */
export const updateAppointmentFeeController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { feeCollected, dressingFee } = req.body;

    const appointment = await Appointment.findByPk(id, {
      include: [
        { model: Patient, as: "patient" },
        { model: User, as: "doctor", attributes: { exclude: ["password"] }, include: [{ model: DoctorProfile, as: "doctorProfile" }] },
      ],
    });
    if (!appointment) return Responder(res, { error: "Appointment not found", httpCode: 404 });

    const updates: Partial<typeof appointment.dataValues> = {};

    if (feeCollected !== undefined) {
      const collected = feeCollected !== false;
      updates.feeCollected = collected;
      updates.feeCollectedAt = collected ? new Date() : null;
    }

    if (dressingFee !== undefined && dressingFee !== null && dressingFee !== "") {
      const num = Number(dressingFee);
      if (Number.isFinite(num) && num >= 0) {
        updates.dressingFee = num;
      }
    }

    await appointment.update(updates);
    await logAudit(
      req.userId!,
      "UPDATE",
      "Appointment",
      id,
      updates.feeCollected ? "Consultation fee collected" : "Appointment fees updated"
    );

    await appointment.reload({
      include: [
        { model: Patient, as: "patient" },
        { model: User, as: "doctor", attributes: { exclude: ["password"] }, include: [{ model: DoctorProfile, as: "doctorProfile" }] },
      ],
    });

    return Responder(res, {
      message: "Fees updated",
      data: { appointment },
      httpCode: 200,
    });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

/** Staff edits appointment properties (reassign doctor, fee collected, dressing fee, status) */
export const updateAppointmentController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { doctorId, feeCollected, dressingFee, status } = req.body;

    const appointment = await Appointment.findByPk(id, {
      include: [
        { model: Patient, as: "patient" },
        { model: User, as: "doctor", attributes: { exclude: ["password"] }, include: [{ model: DoctorProfile, as: "doctorProfile" }] },
      ],
    });
    if (!appointment) return Responder(res, { error: "Appointment not found", httpCode: 404 });

    const updates: any = {};

    if (doctorId && doctorId !== appointment.doctorId) {
      updates.doctorId = doctorId;
      updates.tokenNumber = await getNextToken(doctorId, appointment.appointmentDate);
    }

    if (feeCollected !== undefined) {
      const collected = Boolean(feeCollected);
      updates.feeCollected = collected;
      updates.feeCollectedAt = collected ? new Date() : null;
    }

    if (dressingFee !== undefined && dressingFee !== null) {
      const num = Number(dressingFee);
      if (Number.isFinite(num) && num >= 0) {
        updates.dressingFee = num;
      }
    }

    if (status) {
      updates.status = status;
    }

    await appointment.update(updates);

    await logAudit(
      req.userId!,
      "UPDATE",
      "Appointment",
      id,
      `Appointment updated by staff/admin`
    );

    await appointment.reload({
      include: [
        { model: Patient, as: "patient" },
        { model: User, as: "doctor", attributes: { exclude: ["password"] }, include: [{ model: DoctorProfile, as: "doctorProfile" }] },
      ],
    });

    return Responder(res, {
      message: "Appointment updated successfully",
      data: { appointment },
      httpCode: 200,
    });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

/** Delete a token from today's OP list and renumber remaining tokens for that doctor/date */
export const deleteAppointmentController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findByPk(id);
    if (!appointment) return Responder(res, { error: "Appointment not found", httpCode: 404 });

    if (appointment.status === "in_consultation" || appointment.status === "completed") {
      return Responder(res, {
        error: "Cannot remove a token that is in consultation or already completed",
        httpCode: 400,
      });
    }

    const { doctorId, appointmentDate } = appointment;
    await appointment.destroy();

    // Reshuffle remaining tokens in chronological order (oldest first keeps early numbers)
    const remaining = await Appointment.findAll({
      where: {
        doctorId,
        appointmentDate,
        status: { [Op.ne]: "cancelled" },
      },
      order: [["createdAt", "ASC"]],
    });

    for (let i = 0; i < remaining.length; i++) {
      const nextToken = i + 1;
      if (remaining[i].tokenNumber !== nextToken) {
        await remaining[i].update({ tokenNumber: nextToken });
      }
    }

    await logAudit(req.userId!, "DELETE", "Appointment", id, `Token removed; queue reshuffled for ${appointmentDate}`);

    return Responder(res, { message: "Token removed from OP list", httpCode: 200 });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};
