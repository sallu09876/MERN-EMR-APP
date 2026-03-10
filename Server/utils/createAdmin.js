/**
 * Run once to seed the Super Admin account:
 *   npm run seed:admin
 *
 * Default credentials:
 *   Email:    superadmin@emr.com
 *   Password: Admin@1234
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const createAdmin = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  try {
    const existing = await User.findOne({ email: "superadmin@emr.com" });
    if (existing) {
      // Delete old (possibly broken) record and recreate
      await User.deleteOne({ email: "superadmin@emr.com" });
      console.log("Removed existing admin, recreating...");
    }

    // DO NOT manually hash — the User model's pre('save') hook handles it
    const admin = new User({
      name: "Super Admin",
      email: "superadmin@emr.com",
      password: "Admin@1234",
      role: "SUPER_ADMIN",
    });

    await admin.save();

    console.log("✅ Super Admin created successfully!");
    console.log("   Email:    superadmin@emr.com");
    console.log("   Password: Admin@1234");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();
