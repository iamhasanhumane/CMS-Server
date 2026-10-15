import bcrypt from "bcryptjs";
import User from "../models/user.model";

export const seedAdminUser = async () => {
  try {
    const existingAdmin = await User.unscoped().findOne({
      where: { username: "admin" },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await User.create({
        name: "Administrator",
        username: "admin",
        password: hashedPassword,
        role: "admin",
        isActive: true,
      });
      console.log("✅ Default admin user created (username: admin, password: admin123)");
    }
  } catch (error) {
    console.error("Error seeding admin user:", error);
  }
};
