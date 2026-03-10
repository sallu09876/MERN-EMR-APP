import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    // userId links Doctor profile to the User account used for login
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    workingHoursStart: {
      type: String,
      default: "09:00",
      required: true,
    },
    workingHoursEnd: {
      type: String,
      default: "17:00",
      required: true,
    },
    slotDuration: {
      type: Number,
      default: 30,
      required: true,
    },
    breakStart: {
      type: String,
      default: null,
    },
    breakEnd: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Doctor", doctorSchema);
