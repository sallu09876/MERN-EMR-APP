/**
 * Run once (or anytime) to seed a Patient Portal account:
 *   npm run seed:patient
 *
 * Default credentials:
 *   Email:    patient@emr.com
 *   Password: Patient@1234
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Patient from "../models/Patient.js";

dotenv.config();

const SEED_EMAIL = "patient@emr.com";
const SEED_PASSWORD = "Patient@1234";

const createPatient = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  try {
    const existingUser = await User.findOne({ email: SEED_EMAIL });
    if (existingUser) {
      await Patient.deleteOne({ userId: existingUser._id });
      await User.deleteOne({ _id: existingUser._id });
      console.log("Removed existing seeded patient, recreating...");
    }

    // DO NOT manually hash — the User model's pre('save') hook handles it
    const user = new User({
      name: "Seed Patient",
      email: SEED_EMAIL,
      password: SEED_PASSWORD,
      role: "PATIENT",
    });
    await user.save();

    await Patient.create({
      userId: user._id,
      name: user.name,
      email: user.email,
      isVerified: true,
    });

    console.log("✅ Patient created successfully!");
    console.log(`   Email:    ${SEED_EMAIL}`);
    console.log(`   Password: ${SEED_PASSWORD}`);
  } catch (error) {
    console.error("Error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

createPatient();

