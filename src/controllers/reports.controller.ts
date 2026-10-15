import { Request, Response } from "express";
import { Op } from "sequelize";
import sequelize from "../config/db.config";
import Appointment from "../models/appointment.model";
import Visit from "../models/visit.model";
import Bill from "../models/bill.model";
import Patient from "../models/patient.model";
import AuditLog from "../models/auditLog.model";
import User from "../models/user.model";
import ClinicSettings from "../models/clinicSettings.model";
import DoctorProfile from "../models/doctorProfile.model";
import Prescription from "../models/prescription.model";
import PrescriptionItem from "../models/prescriptionItem.model";
import Medicine from "../models/medicine.model";
import Responder from "../utils/responder";

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const [todayAppointmentsCount, totalPatients, todayCompletedCount] = await Promise.all([
      Appointment.count({ where: { appointmentDate: today } }),
      Patient.count(),
      Appointment.count({ where: { appointmentDate: today, status: "completed" } }),
    ]);

    // Calculate revenue from completed appointments using consultation fee + dressing fee
    const completedAppointments = await Appointment.findAll({
      where: { appointmentDate: today, status: "completed" },
      include: [{
        model: User,
        as: "doctor",
        include: [{ model: DoctorProfile, as: "doctorProfile" }]
      }]
    });

    let todayRevenue = 0;
    for (const appt of completedAppointments) {
      const consultFee = Number((appt as any).doctor?.doctorProfile?.consultationFee || 0);
      const dressingFee = Number((appt as any).dressingFee || 0);
      todayRevenue += consultFee + dressingFee;
    }

    return Responder(res, {
      message: "Dashboard stats",
      data: {
        todayAppointments: todayAppointmentsCount,
        totalPatients,
        todayRevenue,
        todayCompleted: todayCompletedCount,
      },
      httpCode: 200,
    });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const getRevenueReport = async (req: Request, res: Response) => {
  try {
    const { from, to, doctorId, month } = req.query;

    let startDate: Date;
    let endDate: Date;

    if (month) {
      const [year, m] = (month as string).split("-").map(Number);
      startDate = new Date(year, m - 1, 1, 0, 0, 0, 0);
      endDate = new Date(year, m, 0, 23, 59, 59, 999);
    } else {
      startDate = from ? new Date(from as string) : new Date(new Date().setDate(1));
      if (from) startDate.setHours(0, 0, 0, 0);

      endDate = to ? new Date(to as string) : new Date();
      endDate.setHours(23, 59, 59, 999);
    }

    const apptWhere: any = {
      status: "completed",
      createdAt: { [Op.between]: [startDate, endDate] }
    };
    if (doctorId && doctorId !== "all") {
      apptWhere.doctorId = doctorId;
    }

    const appointments = await Appointment.findAll({
      where: apptWhere,
      include: [
        {
          model: User,
          as: "doctor",
          include: [{ model: DoctorProfile, as: "doctorProfile" }]
        }
      ]
    });

    const doctorWhere: any = { role: "doctor", isActive: true };
    if (doctorId && doctorId !== "all") {
      doctorWhere.id = doctorId;
    }
    const doctors = await User.findAll({
      where: doctorWhere,
      include: [{ model: DoctorProfile, as: "doctorProfile" }]
    });

    const docMap: Record<string, {
      id: string;
      name: string;
      specialization: string;
      monthlyVisits: number;
      drFees: number;
      dressingFees: number;
      grandTotal: number;
    }> = {};

    doctors.forEach((doc) => {
      docMap[doc.id] = {
        id: doc.id,
        name: doc.name,
        specialization: (doc as any).doctorProfile?.specialization || "General Physician",
        monthlyVisits: 0,
        drFees: 0,
        dressingFees: 0,
        grandTotal: 0
      };
    });

    const dailyMap: Record<string, { date: string; visitCount: number; drFees: number; dressingFees: number; revenue: number }> = {};

    appointments.forEach((appt: any) => {
      const docId = appt.doctorId;
      const dateStr = appt.appointmentDate || appt.createdAt.toISOString().split("T")[0];
      const consultFee = Number(appt.doctor?.doctorProfile?.consultationFee || 0);
      const dressingFee = Number(appt.dressingFee || 0);

      if (!docMap[docId]) {
        docMap[docId] = {
          id: docId,
          name: appt.doctor?.name || "Doctor",
          specialization: appt.doctor?.doctorProfile?.specialization || "General Physician",
          monthlyVisits: 0,
          drFees: 0,
          dressingFees: 0,
          grandTotal: 0
        };
      }

      docMap[docId].monthlyVisits += 1;
      docMap[docId].drFees += consultFee;
      docMap[docId].dressingFees += dressingFee;
      docMap[docId].grandTotal += (consultFee + dressingFee);

      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { date: dateStr, visitCount: 0, drFees: 0, dressingFees: 0, revenue: 0 };
      }
      dailyMap[dateStr].visitCount += 1;
      dailyMap[dateStr].drFees += consultFee;
      dailyMap[dateStr].dressingFees += dressingFee;
      dailyMap[dateStr].revenue += (consultFee + dressingFee);
    });

    const doctorReport = Object.values(docMap);
    const dailyRevenue = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    const totalVisits = doctorReport.reduce((s, d) => s + d.monthlyVisits, 0);
    const totalDrFees = doctorReport.reduce((s, d) => s + d.drFees, 0);
    const totalDressingFees = doctorReport.reduce((s, d) => s + d.dressingFees, 0);
    const grandTotal = doctorReport.reduce((s, d) => s + d.grandTotal, 0);

    return Responder(res, {
      message: "Revenue report",
      data: {
        doctorReport,
        dailyRevenue,
        summary: {
          totalVisits,
          totalDrFees,
          totalDressingFees,
          grandTotal
        }
      },
      httpCode: 200,
    });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const getAuditLogsController = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { rows: logs, count } = await AuditLog.findAndCountAll({
      include: [{ model: User, as: "user", attributes: ["id", "name", "role"] }],
      order: [["timestamp", "DESC"]],
      limit: Number(limit),
      offset,
    });

    return Responder(res, {
      message: "Audit logs fetched",
      data: { logs, total: count, page: Number(page), totalPages: Math.ceil(count / Number(limit)) },
      httpCode: 200,
    });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const getClinicSettings = async (req: Request, res: Response) => {
  try {
    let settings = await ClinicSettings.findOne();
    if (!settings) {
      settings = await ClinicSettings.create({ clinicName: "My Clinic", paperSize: "A4" });
    }
    return Responder(res, { message: "Settings fetched", data: { settings }, httpCode: 200 });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const updateClinicSettings = async (req: Request, res: Response) => {
  try {
    let settings = await ClinicSettings.findOne();
    if (!settings) {
      settings = await ClinicSettings.create({ clinicName: "My Clinic", paperSize: "A4" });
    }
    await settings.update(req.body);
    return Responder(res, { message: "Settings updated", data: { settings }, httpCode: 200 });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const getFollowUps = async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const horizon = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const where: any = {
      followUpDate: { [Op.between]: [today, horizon] },
    };
    if (req.userRole === "doctor") where.doctorId = req.userId;

    const followUps = await Prescription.findAll({
      where,
      include: [
        { model: Patient, as: "patient" },
        {
          model: Visit,
          as: "visit",
          attributes: ["id", "diagnosisNotes", "symptomsNotes"],
        },
      ],
      order: [["followUpDate", "ASC"]],
    });

    return Responder(res, { message: "Follow-ups fetched", data: { followUps }, httpCode: 200 });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const getDoctorDashboardStats = async (req: Request, res: Response) => {
  try {
    const doctorId = req.userRole === "doctor" ? req.userId : (req.query.doctorId as string);
    if (!doctorId) {
      return Responder(res, { error: "Doctor ID is required", httpCode: 400 });
    }

    const doctorProfile = await DoctorProfile.findOne({ where: { userId: doctorId } });
    const consultationFee = doctorProfile ? Number(doctorProfile.consultationFee) : 0;

    const today = new Date().toISOString().split("T")[0];

    const completedAppointmentsToday = await Appointment.findAll({
      where: {
        doctorId,
        appointmentDate: today,
        status: "completed"
      },
      include: [{ model: Patient, as: "patient" }],
      order: [["tokenNumber", "ASC"]]
    });

    const todayCount = completedAppointmentsToday.length;
    const todayConsultationTotal = todayCount * consultationFee;

    const todayDressingTotal = completedAppointmentsToday.reduce((sum: number, appt: any) => {
      return sum + (Number(appt.dressingFee) || 0);
    }, 0);

    const todayRevenue = todayConsultationTotal + todayDressingTotal;

    const statsByDate = await Appointment.findAll({
      where: {
        doctorId,
        status: "completed"
      },
      attributes: [
        "appointmentDate",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
        [sequelize.fn("SUM", sequelize.fn("COALESCE", sequelize.col("dressingFee"), 0)), "totalDressing"]
      ],
      group: ["appointmentDate"],
      order: [["appointmentDate", "DESC"]],
      raw: true
    });

    const dailyStats = statsByDate.map((s: any) => ({
      date: s.appointmentDate,
      count: Number(s.count),
      revenue: Number(s.count) * consultationFee + Number(s.totalDressing || 0)
    }));

    return Responder(res, {
      message: "Doctor dashboard stats",
      data: {
        todayCompletedCount: todayCount,
        todayConsultationTotal,
        todayDressingTotal,
        todayRevenue,
        consultationFee,
        completedAppointmentsToday,
        dailyStats
      },
      httpCode: 200
    });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};

export const getAdminAnalytics = async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    
    const todayAppointments = await Appointment.findAll({
      where: { appointmentDate: today },
      include: [
        { model: Patient, as: "patient", attributes: ["name", "age", "sex", "uhid"] },
        { model: User, as: "doctor", attributes: ["id", "name"] }
      ],
      order: [["tokenNumber", "ASC"]]
    });

    const doctorsList = await User.findAll({
      where: { role: "doctor", isActive: true },
      include: [{ model: DoctorProfile, as: "doctorProfile" }]
    });

    const doctorStats = [];
    
    for (const doc of doctorsList) {
      const appointmentsCount = await Appointment.count({
        where: { doctorId: doc.id, appointmentDate: today }
      });
      const completedAppointments = await Appointment.findAll({
        where: { doctorId: doc.id, appointmentDate: today, status: "completed" }
      });

      const consultFee = Number((doc as any).doctorProfile?.consultationFee || 0);
      const consultationTotal = completedAppointments.length * consultFee;
      const dressingTotal = completedAppointments.reduce((sum, appt: any) => sum + (Number(appt.dressingFee) || 0), 0);
      const revenue = consultationTotal + dressingTotal;

      doctorStats.push({
        id: doc.id,
        name: doc.name,
        specialization: (doc as any).doctorProfile?.specialization || "General Medicine",
        totalAppointments: appointmentsCount,
        completedAppointments: completedAppointments.length,
        revenue
      });
    }

    return Responder(res, {
      message: "Admin analytics fetched",
      data: {
        todayAppointments,
        doctorStats
      },
      httpCode: 200
    });
  } catch (error: any) {
    Responder(res, { error: error.message, httpCode: 500 });
  }
};
