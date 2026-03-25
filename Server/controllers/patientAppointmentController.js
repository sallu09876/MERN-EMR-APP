import Joi from "joi";
import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import { getSlotsForDoctorAndDate } from "../services/slotService.js";
import { sendMail } from "../config/mailer.js";
import {
  appointmentConfirmTemplate,
  appointmentCancelTemplate,
} from "../config/emailTemplates.js";

const bookingSchema = Joi.object({
  doctorId: Joi.string().hex().length(24).required(),
  appointmentDate: Joi.date().required(),
  slotStartTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  slotEndTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
});

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export const availableSlots = async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) {
      res.status(400);
      throw new Error("doctorId and date are required");
    }

    const slots = await getSlotsForDoctorAndDate(doctorId, date);
    return res.json({ success: true, data: slots });
  } catch (err) {
    next(err);
  }
};

export const patientBook = async (req, res, next) => {
  try {
    const { error, value } = bookingSchema.validate(req.body);
    if (error) {
      res.status(400);
      throw new Error(error.details[0].message);
    }

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      res.status(404);
      throw new Error("Patient profile not found");
    }

    const { doctorId, appointmentDate, slotStartTime, slotEndTime } = value;

    const slots = await getSlotsForDoctorAndDate(doctorId, appointmentDate);
    const selected = slots.find(
      (s) => s.start === slotStartTime && s.end === slotEndTime && s.status === "AVAILABLE"
    );
    if (!selected) {
      res.status(409);
      throw new Error("This slot is no longer available");
    }

    const appointment = await Appointment.create({
      doctorId,
      patientId: patient._id,
      appointmentDate: new Date(appointmentDate),
      slotStartTime,
      slotEndTime,
      status: "BOOKED",
      createdBy: req.user._id,
      bookedBy: "PATIENT",
      paymentStatus: "UNPAID",
    });

    const doctor = await Doctor.findById(doctorId);

    void sendMail({
      to: patient.email || patient.mobile || "",
      subject: "MedFlow · Appointment confirmed",
      html: appointmentConfirmTemplate(
        patient.name,
        doctor?.name || "Our Doctor",
        formatDate(appointmentDate),
        `${slotStartTime}–${slotEndTime}`
      ),
    }).catch(() => {});

    return res.status(201).json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
};

export const myAppointments = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      res.status(404);
      throw new Error("Patient profile not found");
    }

    const items = await Appointment.find({ patientId: patient._id })
      .populate("doctorId", "name department")
      .sort({ appointmentDate: -1, slotStartTime: 1 });

    return res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};

export const cancelMyAppointment = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      res.status(404);
      throw new Error("Patient profile not found");
    }

    const appointment = await Appointment.findById(req.params.id).populate(
      "doctorId",
      "name department"
    );

    if (!appointment || String(appointment.patientId) !== String(patient._id)) {
      res.status(404);
      throw new Error("Appointment not found");
    }

    // Only cancel future appointments.
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const apptDate = new Date(appointment.appointmentDate);
    if (apptDate < todayStart) {
      res.status(400);
      throw new Error("Only future appointments can be cancelled");
    }

    await Appointment.findByIdAndDelete(req.params.id);

    void sendMail({
      to: patient.email || patient.mobile || "",
      subject: "MedFlow · Appointment cancelled",
      html: appointmentCancelTemplate(
        patient.name,
        appointment.doctorId?.name || "Our Doctor",
        formatDate(appointment.appointmentDate),
        `${appointment.slotStartTime}–${appointment.slotEndTime}`
      ),
    }).catch(() => {});

    return res.json({ success: true, message: "Appointment cancelled" });
  } catch (err) {
    next(err);
  }
};

