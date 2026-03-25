import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    razorpayOrderId: { type: String, unique: true, required: true },
    razorpayPaymentId: { type: String, default: "" },

    amount: { type: Number, default: 100 }, // in paise
    currency: { type: String, default: "INR" },

    status: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
    },

    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },

    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    appointmentDate: { type: Date, required: true },
    slotStartTime: { type: String, required: true },
    slotEndTime: { type: String, required: true },
  },
  { timestamps: true }
);

// Auto-delete abandoned PENDING payment records after 1 hour.
paymentSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 3600,
    partialFilterExpression: { status: "PENDING" },
  }
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;

