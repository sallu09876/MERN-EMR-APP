import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    // Links a patient profile to a dedicated login user (created via patient portal).
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      sparse: true,
    },

    name: { type: String, required: true, trim: true },
    // Receptionists may create patients with mobile, but patient signup can start
    // with minimal info and complete later.
    mobile: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    dob: { type: Date },
    gender: { type: String, enum: ["MALE", "FEMALE", "OTHER"], trim: true },

    // Patient portal profile fields
    age: { type: Number },
    bloodGroup: { type: String },
    address: { type: String },
    medicalHistory: { type: String },
    profilePhoto: { type: String, default: "" }, // Cloudinary URL
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

patientSchema.index({ name: 1 });
patientSchema.index({ mobile: 1 });
// `userId` already has a unique index via the schema field definition.

const Patient = mongoose.model("Patient", patientSchema);

export default Patient;

