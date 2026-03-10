import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import { logAction } from "../services/logService.js";
import {
  appointmentCreateSchema,
  appointmentUpdateSchema,
} from "../validations/appointmentValidation.js";

export const createAppointment = async (req, res, next) => {
  try {
    const { error, value } = appointmentCreateSchema.validate(req.body);
    if (error) {
      res.status(400);
      throw new Error(error.details[0].message);
    }

    const {
      doctorId,
      appointmentDate,
      slotStartTime,
      slotEndTime,
      purpose,
      notes,
      patientType,
      patientId,
      patient: patientPayload,
    } = value;

    let finalPatientId = patientId;

    if (patientType === "NEW") {
      const newPatient = await Patient.create(patientPayload);
      finalPatientId = newPatient._id;
    }

    const appointmentData = {
      doctorId,
      patientId: finalPatientId,
      appointmentDate,
      slotStartTime,
      slotEndTime,
      purpose,
      notes,
      createdBy: req.user._id,
    };

    try {
      const appointment = await Appointment.create(appointmentData);

      await logAction({
        userId: req.user._id,
        role: req.user.role,
        action: "APPOINTMENT_CREATED",
        entity: `appointment:${appointment._id}`,
      });

      res.status(201).json({ success: true, data: appointment });
    } catch (err) {
      if (err.code === 11000) {
        res.status(409);
        return next(new Error("Slot already booked for this doctor and time"));
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

export const getAppointments = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      doctorId,
      status,
      date,
    } = req.query;

    const query = {};

    if (doctorId) {
      query.doctorId = doctorId;
    }

    if (status) {
      query.status = status;
    }

    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      query.appointmentDate = { $gte: dayStart, $lt: dayEnd };
    }

    // Role-based filtering: doctors can only see their own appointments
    if (req.user.role === "DOCTOR") {
      const doctorProfile = await Doctor.findOne({ userId: req.user._id });
      if (doctorProfile) {
        query.doctorId = doctorProfile._id;
      }
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const [items, total] = await Promise.all([
      Appointment.find(query)
        .populate("doctorId", "name department")
        .populate("patientId", "name mobile")
        .sort({ appointmentDate: -1, slotStartTime: 1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Appointment.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: items,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateAppointment = async (req, res, next) => {
  try {
    const { error, value } = appointmentUpdateSchema.validate(req.body);
    if (error) {
      res.status(400);
      throw new Error(error.details[0].message);
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      value,
      { new: true, runValidators: true }
    );

    if (!appointment) {
      res.status(404);
      throw new Error("Appointment not found");
    }

    await logAction({
      userId: req.user._id,
      role: req.user.role,
      action: "APPOINTMENT_UPDATED",
      entity: `appointment:${appointment._id}`,
    });

    res.json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
};

export const deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);

    if (!appointment) {
      res.status(404);
      throw new Error("Appointment not found");
    }

    await logAction({
      userId: req.user._id,
      role: req.user.role,
      action: "APPOINTMENT_DELETED",
      entity: `appointment:${appointment._id}`,
    });

    res.json({ success: true, message: "Appointment deleted" });
  } catch (err) {
    next(err);
  }
};

export const markArrived = async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: "ARRIVED" },
      { new: true }
    );

    if (!appointment) {
      res.status(404);
      throw new Error("Appointment not found");
    }

    await logAction({
      userId: req.user._id,
      role: req.user.role,
      action: "APPOINTMENT_ARRIVED",
      entity: `appointment:${appointment._id}`,
    });

    res.json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
};

