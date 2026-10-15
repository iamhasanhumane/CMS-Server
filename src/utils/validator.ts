import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const createDoctorSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(3),
  password: z.string().min(6),
  phone: z.string().optional(),
  specialization: z.string().min(1),
  qualification: z.string().min(1),
  registrationNo: z.string().min(1),
  consultationFee: z.number().optional(),
  workingDays: z.array(z.string()).optional(),
  workingHours: z.string().optional(),
});

export const createStaffSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(3),
  password: z.string().min(6),
  phone: z.string().optional(),
  designation: z.string().optional(),
});

export const createPatientSchema = z.object({
  name: z.string().min(1),
  sex: z.enum(["male", "female", "other"]),
  age: z.number().optional(),
  dob: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  allergiesNotes: z.string().optional(),
  chronicConditions: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});
