import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true },

    // Hashed with bcrypt
    otp: { type: String, required: true },

    purpose: {
      type: String,
      enum: ["SIGNUP", "FORGOT_PASSWORD", "LOGIN_ALERT"],
      required: true,
    },

    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },

    // Signup context we need at OTP verification time.
    name: { type: String, trim: true },
    passwordHash: { type: String, trim: true },
  },
  { timestamps: true },
);

// MongoDB auto-deletes expired OTPs.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTP = mongoose.model("OTP", otpSchema);

export default OTP;

