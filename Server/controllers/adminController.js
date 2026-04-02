import Doctor from "../models/Doctor.js";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";

export const getSystemStats = async (req, res, next) => {
  try {
    const [totalDoctors, totalReceptionists, totalAppointments, totalPatients, totalUnverified] = await Promise.all([
      Doctor.countDocuments(),
      User.countDocuments({ role: "RECEPTIONIST" }),
      Appointment.countDocuments(),
      Patient.countDocuments({ isVerified: true }),
      Patient.countDocuments({ isVerified: false }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayAppointments, bookedCount, arrivedCount] = await Promise.all([
      Appointment.countDocuments({ appointmentDate: { $gte: today, $lt: tomorrow } }),
      Appointment.countDocuments({ status: "BOOKED" }),
      Appointment.countDocuments({ status: "ARRIVED" }),
    ]);

    res.json({
      success: true,
      data: {
        totalDoctors,
        totalReceptionists,
        totalAppointments,
        totalPatients,
        totalUnverified,
        todayAppointments,
        bookedCount,
        arrivedCount,
      },
    });
  } catch (err) {
    next(err);
  }
};
