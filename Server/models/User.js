import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["SUPER_ADMIN", "DOCTOR", "RECEPTIONIST", "PATIENT"],
      required: true,
      default: "RECEPTIONIST",
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  // Allow creating a user with a pre-hashed bcrypt password (e.g. patient OTP signup).
  // If password already looks like a bcrypt hash, do not hash again.
  const looksLikeBcryptHash =
    typeof this.password === "string" && /^\$2[abyxy]\$/.test(this.password);
  if (looksLikeBcryptHash) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userSchema);

export default User;
