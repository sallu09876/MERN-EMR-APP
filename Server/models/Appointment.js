import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    slotStartTime: {
      type: String,
      required: true, // "HH:mm"
    },
    slotEndTime: {
      type: String,
      required: true, // "HH:mm"
    },
    purpose: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["BOOKED", "ARRIVED", "COMPLETED", "CANCELLED"],
      default: "BOOKED",
    },
    // Who booked this appointment
    bookedBy: {
      type: String,
      enum: ["RECEPTIONIST", "PATIENT"],
      default: "RECEPTIONIST",
    },

    // Razorpay payment linkage (PATIENT bookings only)
    paymentId: { type: String, default: "" },
    paymentStatus: {
      type: String,
      enum: ["PAID", "UNPAID"],
      default: "UNPAID",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

appointmentSchema.index({ doctorId: 1 });
appointmentSchema.index({ appointmentDate: 1 });
appointmentSchema.index({ patientId: 1 });

// Prevent double booking: same doctor, date, and slotStartTime
appointmentSchema.index(
  { doctorId: 1, appointmentDate: 1, slotStartTime: 1 },
  { unique: true }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;

