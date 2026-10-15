import User from "../models/user.model";
import DoctorProfile from "../models/doctorProfile.model";
import StaffProfile from "../models/staffProfile.model";
import bcrypt from "bcryptjs";

export const findUserByUsername = async (username: string) => {
  return await User.unscoped().findOne({ where: { username } });
};

export const findUserById = async (userId: string) => {
  return await User.findByPk(userId, {
    include: [
      { model: DoctorProfile, as: "doctorProfile" },
      { model: StaffProfile, as: "staffProfile" },
    ],
  });
};

export const findUserByIdUnscoped = async (userId: string) => {
  return await User.unscoped().findByPk(userId);
};

export const checkPassword = async (
  password: string,
  hashedPassword: string
) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const createUser = async (data: {
  name: string;
  username: string;
  password: string;
  role: "admin" | "doctor" | "staff";
  phone?: string;
}) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  return await User.create({
    name: data.name,
    username: data.username,
    password: hashedPassword,
    role: data.role,
    phone: data.phone || null,
  });
};
