import { Request, Response } from "express";
import Bill from "../models/bill.model";
import BillItem from "../models/billItem.model";
import Prescription from "../models/prescription.model";
import PrescriptionItem from "../models/prescriptionItem.model";
import Medicine from "../models/medicine.model";
import Patient from "../models/patient.model";
import User from "../models/user.model";
import { logAudit } from "../services/audit.service";
import Responder from "../utils/responder";

export const createBillController = async (req: Request, res: Response) => {
  try {
    const { prescriptionId, patientId, consultationFee, discount, paymentMode, items } = req.body;

    let totalMedicines = 0;
    const billItems: { medicineId: string; quantity: number; rate: number; amount: number }[] = [];

    for (const item of items) {
      const amount = item.quantity * item.rate;
      totalMedicines += amount;
      billItems.push({ medicineId: item.medicineId, quantity: item.quantity, rate: item.rate, amount });
    }

    const totalAmount = totalMedicines + Number(consultationFee || 0) - Number(discount || 0);

    const bill = await Bill.create({
      prescriptionId: prescriptionId || null,
      patientId,
      billedBy: req.userId!,
      consultationFee: Number(consultationFee || 0),
      discount: Number(discount || 0),
      totalAmount,
      paymentMode: paymentMode || "cash",
    });

    for (const item of billItems) {
      await BillItem.create({ billId: bill.id, ...item });
    }

    await logAudit(req.userId!, "CREATE", "Bill", bill.id, `Bill ₹${totalAmount} for patient`);

    const full = await Bill.findByPk(bill.id, {
      include: [
        { model: BillItem, as: "items", include: [{ model: Medicine, as: "medicine" }] },
        { model: Patient, as: "patient" },
      ],
    });

    return Responder(res, { message: "Bill generated", data: { bill: full }, httpCode: 201 });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const getBillsController = async (req: Request, res: Response) => {
  try {
    const { patientId, page = 1, limit = 20 } = req.query;
    const where: any = {};
    if (patientId) where.patientId = patientId;

    const offset = (Number(page) - 1) * Number(limit);
    const { rows: bills, count } = await Bill.findAndCountAll({
      where,
      include: [
        { model: BillItem, as: "items", include: [{ model: Medicine, as: "medicine" }] },
        { model: Patient, as: "patient" },
        { model: User, as: "biller", attributes: ["id", "name"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: Number(limit),
      offset,
    });

    return Responder(res, {
      message: "Bills fetched",
      data: { bills, total: count, page: Number(page), totalPages: Math.ceil(count / Number(limit)) },
      httpCode: 200,
    });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const getBillByIdController = async (req: Request, res: Response) => {
  try {
    const bill = await Bill.findByPk(req.params.id, {
      include: [
        { model: BillItem, as: "items", include: [{ model: Medicine, as: "medicine" }] },
        { model: Patient, as: "patient" },
        { model: User, as: "biller", attributes: ["id", "name"] },
        { model: Prescription, as: "prescription" },
      ],
    });
    if (!bill) return Responder(res, { error: "Bill not found", httpCode: 404 });
    return Responder(res, { message: "Bill fetched", data: { bill }, httpCode: 200 });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};
