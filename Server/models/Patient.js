import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    dob: { type: Date },
    gender: { type: String, enum: ["MALE", "FEMALE", "OTHER"], trim: true },
  },
  { timestamps: true }
);

patientSchema.index({ name: 1 });
patientSchema.index({ mobile: 1 });

const Patient = mongoose.model("Patient", patientSchema);

export default Patient;

