import mongoose from "mongoose";
import Patient from "../models/Patient.js";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";

const parseVerifiedQuery = (verified) => {
  if (verified === undefined || verified === null) return null;
  const v = String(verified).toLowerCase().trim();
  if (v === "true") return true;
  if (v === "false") return false;
  if (v === "all" || v === "") return null;
  return null;
};

export const getPatientStats = async (req, res, next) => {
  try {
    const [totalPatients, totalUnverified, totalAppointmentsByPatients] =
      await Promise.all([
        Patient.countDocuments({ isVerified: true }),
        Patient.countDocuments({ isVerified: false }),
        Appointment.countDocuments(),
      ]);

    return res.json({
      success: true,
      data: { totalPatients, totalUnverified, totalAppointmentsByPatients },
    });
  } catch (err) {
    next(err);
  }
};

export const getPatients = async (req, res, next) => {
  try {
    const pageNum = parseInt(req.query.page, 10) || 1;
    const limitNum = parseInt(req.query.limit, 10) || 20;
    const search = String(req.query.search || "").trim();

    const match = {};

    const verified = parseVerifiedQuery(req.query.verified);
    if (verified !== null) match.isVerified = verified;

    if (search) {
      const regex = new RegExp(search, "i");
      const userDocs = await User.find({ email: regex, role: "PATIENT" }).select("_id").lean();
      const userIds = userDocs.map((u) => u._id);

      match.$or = [
        { name: regex },
        { email: regex },
        ...(userIds.length ? [{ userId: { $in: userIds } }] : []),
      ];
    }

    const [total, patients] = await Promise.all([
      Patient.countDocuments(match),
      Patient.find(match)
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate("userId", "email")
        .lean(),
    ]);

    const patientIds = patients.map((p) => p._id);
    const counts = await Appointment.aggregate([
      { $match: { patientId: { $in: patientIds } } },
      { $group: { _id: "$patientId", count: { $sum: 1 } } },
    ]);

    const countMap = counts.reduce((acc, c) => {
      acc[String(c._id)] = c.count;
      return acc;
    }, {});

    const data = patients.map((p) => ({
      ...p,
      appointmentCount: countMap[String(p._id)] || 0,
    }));

    return res.json({
      success: true,
      data,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
    });
  } catch (err) {
    next(err);
  }
};

export const getPatientById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400);
      throw new Error("Invalid patient id");
    }

    const patient = await Patient.findById(req.params.id)
      .populate("userId", "email")
      .lean();

    if (!patient) {
      res.status(404);
      throw new Error("Patient not found");
    }

    const appointments = await Appointment.find({ patientId: patient._id })
      .sort({ appointmentDate: -1, slotStartTime: 1 })
      .limit(5)
      .populate("doctorId", "name");

    return res.json({
      success: true,
      data: { ...patient, appointments },
    });
  } catch (err) {
    next(err);
  }
};

export const deletePatient = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400);
      throw new Error("Invalid patient id");
    }

    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      res.status(404);
      throw new Error("Patient not found");
    }

    await Appointment.deleteMany({ patientId: patient._id });
    const userId = patient.userId;
    await Patient.findByIdAndDelete(patient._id);
    if (userId) {
      await User.findByIdAndDelete(userId);
    }

    return res.json({ success: true, message: "Patient deleted" });
  } catch (err) {
    next(err);
  }
};

