import { Request, Response } from "express";
import { Op } from "sequelize";
import Medicine, { MedicineForm } from "../models/medicine.model";
import { logAudit } from "../services/audit.service";
import Responder from "../utils/responder";

const MEDICINE_FORMS: MedicineForm[] = [
  "tablet", "syrup", "injection", "capsule", "cream", "drops", "inhaler", "other",
];

type MedicineInput = {
  name?: unknown;
  genericName?: unknown;
  rac?: unknown;
  form?: unknown;
};

const pickMedicineFields = (body: MedicineInput) => {
  const form = typeof body.form === "string" && MEDICINE_FORMS.includes(body.form as MedicineForm)
    ? (body.form as MedicineForm)
    : "tablet";

  return {
    name: String(body.name ?? "").trim(),
    genericName: body.genericName != null && String(body.genericName).trim()
      ? String(body.genericName).trim()
      : null,
    rac: body.rac != null && String(body.rac).trim()
      ? String(body.rac).trim()
      : null,
    form,
  };
};

export const createMedicineController = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || !String(name).trim()) {
      return Responder(res, { error: "Medicine name is required", httpCode: 400 });
    }

    const medicine = await Medicine.create(pickMedicineFields(req.body));
    await logAudit(req.userId!, "CREATE", "Medicine", medicine.id, `Added medicine: ${medicine.name}`);
    return Responder(res, { message: "Medicine added", data: { medicine }, httpCode: 201 });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const getMedicinesController = async (req: Request, res: Response) => {
  try {
    const { search, page, limit } = req.query;
    const where: any = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { genericName: { [Op.iLike]: `%${search}%` } },
        { rac: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (page && limit) {
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;
      const offset = (pageNum - 1) * limitNum;

      const { count, rows: medicines } = await Medicine.findAndCountAll({
        where,
        order: [["name", "ASC"]],
        limit: limitNum,
        offset,
      });

      return Responder(res, { 
        message: "Medicines fetched", 
        data: { medicines, total: count, page: pageNum, limit: limitNum }, 
        httpCode: 200 
      });
    } else {
      const medicines = await Medicine.findAll({ where, order: [["name", "ASC"]] });
      return Responder(res, { message: "Medicines fetched", data: { medicines, total: medicines.length }, httpCode: 200 });
    }
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const updateMedicineController = async (req: Request, res: Response) => {
  try {
    const medicine = await Medicine.findByPk(req.params.id);
    if (!medicine) return Responder(res, { error: "Medicine not found", httpCode: 404 });

    await medicine.update(pickMedicineFields(req.body));
    await logAudit(req.userId!, "UPDATE", "Medicine", medicine.id, `Updated medicine: ${medicine.name}`);
    return Responder(res, { message: "Medicine updated", data: { medicine }, httpCode: 200 });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const deleteMedicineController = async (req: Request, res: Response) => {
  try {
    const medicine = await Medicine.findByPk(req.params.id);
    if (!medicine) return Responder(res, { error: "Medicine not found", httpCode: 404 });

    await logAudit(req.userId!, "DELETE", "Medicine", medicine.id, `Deleted medicine: ${medicine.name}`);
    await medicine.destroy();
    return Responder(res, { message: "Medicine deleted", httpCode: 200 });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};


