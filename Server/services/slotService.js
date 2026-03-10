import Doctor from "../models/Doctor.js";
import Appointment from "../models/Appointment.js";
import { generateSlots } from "../utils/slotGenerator.js";

export const getSlotsForDoctorAndDate = async (doctorId, date) => {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    const err = new Error("Doctor not found");
    err.statusCode = 404;
    throw err;
  }

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const appointments = await Appointment.find({
    doctorId,
    appointmentDate: { $gte: dayStart, $lt: dayEnd },
    status: { $ne: "CANCELLED" },
  }).select("slotStartTime slotEndTime");

  const baseSlots = generateSlots(
    doctor.workingHoursStart,
    doctor.workingHoursEnd,
    doctor.slotDuration,
    doctor.breakStart,
    doctor.breakEnd
  );

  const bookedSet = new Set(
    appointments.map((a) => `${a.slotStartTime}-${a.slotEndTime}`)
  );

  const now = new Date();

  const slots = baseSlots.map((slot) => {
    const key = `${slot.start}-${slot.end}`;
    const isBooked = bookedSet.has(key);

    const slotDateTime = new Date(date);
    const [h, m] = slot.start.split(":").map(Number);
    slotDateTime.setHours(h, m, 0, 0);

    const isPast = slotDateTime < now;

    return {
      start: slot.start,
      end: slot.end,
      status: isBooked || isPast ? "BOOKED" : "AVAILABLE",
    };
  });

  return slots;
};

