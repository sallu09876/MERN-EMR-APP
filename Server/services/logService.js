import Log from "../models/Log.js";

export const logAction = async ({ userId, role, action, entity }) => {
  try {
    await Log.create({
      userId,
      role,
      action,
      entity,
      timestamp: new Date(),
    });
  } catch (err) {
    // Intentionally swallow logging errors to avoid breaking main flow
    if (process.env.NODE_ENV !== "production") {
      console.error("Log error:", err.message);
    }
  }
};

