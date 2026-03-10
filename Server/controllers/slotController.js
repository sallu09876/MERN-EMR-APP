import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";

export const getSlots = async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({
        message: "Doctor not found",
      });
    }

    const slots = [];

    const start = doctor.workingHoursStart.split(":");
    const end = doctor.workingHoursEnd.split(":");

    let startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
    const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);

    while (startMinutes < endMinutes) {
      const hour = Math.floor(startMinutes / 60);
      const minute = startMinutes % 60;

      const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

      slots.push(time);

      startMinutes += doctor.slotDuration;
    }

    const bookedAppointments = await Appointment.find({
      doctorId,
      appointmentDate: date,
    });

    const bookedSlots = bookedAppointments.map((a) => a.slot);

    const availableSlots = slots.map((slot) => ({
      time: slot,
      booked: bookedSlots.includes(slot),
    }));

    res.json({
      success: true,
      data: availableSlots,
    });
  } catch (err) {
    next(err);
  }
};
