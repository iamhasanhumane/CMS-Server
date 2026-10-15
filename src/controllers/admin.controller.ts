import { Request, Response } from "express";
import User from "../models/user.model";
import DoctorProfile from "../models/doctorProfile.model";
import StaffProfile from "../models/staffProfile.model";
import { createUser } from "../services/user.service";
import { logAudit } from "../services/audit.service";
import Responder from "../utils/responder";
import bcrypt from "bcryptjs";

// ── Doctor Management ──
export const createDoctorController = async (req: Request, res: Response) => {
  try {
    const { name, username, password, phone, specialization, qualification, registrationNo, consultationFee, workingDays, workingHours } = req.body;

    const existing = await User.unscoped().findOne({ where: { username } });
    if (existing) return Responder(res, { error: "Username already taken", httpCode: 400 });

    const user = await createUser({ name, username, password, role: "doctor", phone });

    await DoctorProfile.create({
      userId: user.id,
      specialization,
      qualification,
      registrationNo,
      consultationFee: consultationFee || 0,
      workingDays: JSON.stringify(workingDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]),
      workingHours: workingHours || "09:00-17:00",
    });

    await logAudit(req.userId!, "CREATE", "Doctor", user.id, `Created doctor: ${name}`);

    const fullUser = await User.findByPk(user.id, { include: [{ model: DoctorProfile, as: "doctorProfile" }] });
    return Responder(res, { message: "Doctor created successfully", data: { doctor: fullUser }, httpCode: 201 });
  } catch (error: any) {
    console.error(error);
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const getDoctorsController = async (req: Request, res: Response) => {
  try {
    const doctors = await User.findAll({
      where: { role: "doctor" },
      include: [{ model: DoctorProfile, as: "doctorProfile" }],
      order: [["createdAt", "DESC"]],
    });
    return Responder(res, { message: "Doctors fetched", data: { doctors }, httpCode: 200 });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const updateDoctorController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phone, isActive, specialization, qualification, registrationNo, consultationFee, workingDays, workingHours } = req.body;

    const user = await User.findByPk(id);
    if (!user) return Responder(res, { error: "Doctor not found", httpCode: 404 });

    await user.update({ name: name ?? user.name, phone: phone ?? user.phone, isActive: isActive ?? user.isActive });

    const profile = await DoctorProfile.findOne({ where: { userId: id } });
    if (profile) {
      await profile.update({
        specialization: specialization ?? profile.specialization,
        qualification: qualification ?? profile.qualification,
        registrationNo: registrationNo ?? profile.registrationNo,
        consultationFee: consultationFee ?? profile.consultationFee,
        workingDays: workingDays ? JSON.stringify(workingDays) : profile.workingDays,
        workingHours: workingHours ?? profile.workingHours,
      });
    }

    await logAudit(req.userId!, "UPDATE", "Doctor", id, `Updated doctor: ${name || user.name}`);

    const fullUser = await User.findByPk(id, { include: [{ model: DoctorProfile, as: "doctorProfile" }] });
    return Responder(res, { message: "Doctor updated", data: { doctor: fullUser }, httpCode: 200 });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

// ── Staff Management ──
export const createStaffController = async (req: Request, res: Response) => {
  try {
    const { name, username, password, phone, designation } = req.body;

    const existing = await User.unscoped().findOne({ where: { username } });
    if (existing) return Responder(res, { error: "Username already taken", httpCode: 400 });

    const user = await createUser({ name, username, password, role: "staff", phone });
    await StaffProfile.create({ userId: user.id, designation });

    await logAudit(req.userId!, "CREATE", "Staff", user.id, `Created staff: ${name}`);

    const fullUser = await User.findByPk(user.id, { include: [{ model: StaffProfile, as: "staffProfile" }] });
    return Responder(res, { message: "Staff created successfully", data: { staff: fullUser }, httpCode: 201 });
  } catch (error: any) {
    console.error(error);
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const getStaffController = async (req: Request, res: Response) => {
  try {
    const staff = await User.findAll({
      where: { role: "staff" },
      include: [{ model: StaffProfile, as: "staffProfile" }],
      order: [["createdAt", "DESC"]],
    });
    return Responder(res, { message: "Staff fetched", data: { staff }, httpCode: 200 });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const updateStaffController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phone, isActive, designation } = req.body;

    const user = await User.findByPk(id);
    if (!user) return Responder(res, { error: "Staff not found", httpCode: 404 });

    await user.update({ name: name ?? user.name, phone: phone ?? user.phone, isActive: isActive ?? user.isActive });

    const profile = await StaffProfile.findOne({ where: { userId: id } });
    if (profile) {
      await profile.update({ designation: designation ?? profile.designation });
    }

    await logAudit(req.userId!, "UPDATE", "Staff", id, `Updated staff: ${name || user.name}`);

    const fullUser = await User.findByPk(id, { include: [{ model: StaffProfile, as: "staffProfile" }] });
    return Responder(res, { message: "Staff updated", data: { staff: fullUser }, httpCode: 200 });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};
