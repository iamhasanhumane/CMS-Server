import ClinicSettings from "../models/clinicSettings.model";

export const seedClinicSettings = async () => {
  try {
    const existing = await ClinicSettings.findOne();
    if (!existing) {
      await ClinicSettings.create({
        clinicName: "Sri Lakshmi Hospital",
        address: "123 Main Street",
        phone: "9876543210",
        paperSize: "A4",
      });
      console.log("✅ Default clinic settings created");
    }
  } catch (error) {
    console.error("Error seeding clinic settings:", error);
  }
};
