import Joi from "joi";
import Doctor from "../models/Doctor.js";
import User from "../models/User.js";
import mongoose from "mongoose";

const doctorCreateSchema = Joi.object({
  name: Joi.string().trim().required(),
  department: Joi.string().trim().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  workingHoursStart: Joi.string().pattern(/^\d{2}:\d{2}$/).default("09:00"),
  workingHoursEnd: Joi.string().pattern(/^\d{2}:\d{2}$/).default("17:00"),
  slotDuration: Joi.number().integer().min(5).max(120).default(30),
  breakStart: Joi.string().pattern(/^\d{2}:\d{2}$/).allow("", null).optional(),
  breakEnd: Joi.string().pattern(/^\d{2}:\d{2}$/).allow("", null).optional(),
});

const doctorUpdateSchema = Joi.object({
  name: Joi.string().trim().optional(),
  department: Joi.string().trim().optional(),
  workingHoursStart: Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
  workingHoursEnd: Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
  slotDuration: Joi.number().integer().min(5).max(120).optional(),
  breakStart: Joi.string().pattern(/^\d{2}:\d{2}$/).allow("", null).optional(),
  breakEnd: Joi.string().pattern(/^\d{2}:\d{2}$/).allow("", null).optional(),
});

export const getDoctors = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.department) query.department = req.query.department;

    const doctors = await Doctor.find(query)
      .populate("userId", "name email")
      .sort({ name: 1 });

    res.json({ success: true, data: doctors });
  } catch (error) {
    next(error);
  }
};

export const createDoctor = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { error, value } = doctorCreateSchema.validate(req.body);
    if (error) {
      res.status(400);
      throw new Error(error.details[0].message);
    }

    const { name, department, email, password, workingHoursStart, workingHoursEnd, slotDuration, breakStart, breakEnd } = value;

    // Create login User — pre('save') hook on User model handles password hashing
    const userDoc = new User({ name, email, password, role: "DOCTOR" });
    await userDoc.save({ session });

    // Create Doctor profile linked to User
    const doctorDoc = new Doctor({
      name, department, userId: userDoc._id,
      workingHoursStart, workingHoursEnd, slotDuration,
      breakStart: breakStart || null,
      breakEnd: breakEnd || null,
    });
    await doctorDoc.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      data: {
        _id: doctorDoc._id,
        name: doctorDoc.name,
        department: doctorDoc.department,
        email: userDoc.email,
        workingHoursStart: doctorDoc.workingHoursStart,
        workingHoursEnd: doctorDoc.workingHoursEnd,
        slotDuration: doctorDoc.slotDuration,
        breakStart: doctorDoc.breakStart,
        breakEnd: doctorDoc.breakEnd,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    if (error.code === 11000) {
      res.status(409);
      return next(new Error("Email already in use"));
    }
    next(error);
  }
};

export const updateDoctor = async (req, res, next) => {
  try {
    const { error, value } = doctorUpdateSchema.validate(req.body);
    if (error) {
      res.status(400);
      throw new Error(error.details[0].message);
    }

    const doctor = await Doctor.findByIdAndUpdate(req.params.id, value, {
      new: true,
      runValidators: true,
    });

    if (!doctor) {
      res.status(404);
      throw new Error("Doctor not found");
    }

    res.json({ success: true, data: doctor });
  } catch (error) {
    next(error);
  }
};

export const deleteDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) {
      res.status(404);
      throw new Error("Doctor not found");
    }
    if (doctor.userId) {
      await User.findByIdAndDelete(doctor.userId);
    }
    res.json({ success: true, message: "Doctor deleted" });
  } catch (error) {
    next(error);
  }
};
