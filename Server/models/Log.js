import mongoose from "mongoose";

const logSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  role: {
    type: String,
    enum: ["SUPER_ADMIN", "DOCTOR", "RECEPTIONIST"],
  },
  action: {
    type: String,
    required: true,
  },
  entity: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

logSchema.index({ timestamp: -1 });
logSchema.index({ userId: 1, timestamp: -1 });

const Log = mongoose.model("Log", logSchema);

export default Log;

