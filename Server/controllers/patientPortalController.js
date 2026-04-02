import Joi from "joi";

import Patient from "../models/Patient.js";
import User from "../models/User.js";

const profileUpdateSchema = Joi.object({
  name: Joi.string().trim().optional(),
  age: Joi.number().integer().min(0).optional(),
  gender: Joi.string().trim().optional(),
  bloodGroup: Joi.string().trim().optional(),
  mobile: Joi.string().pattern(/^[0-9]+$/).optional(),
  address: Joi.string().trim().optional().allow(""),
  medicalHistory: Joi.string().trim().optional().allow(""),
});

const normalizeGender = (g) => {
  if (!g) return g;
  const up = String(g).toUpperCase();
  if (up === "MALE" || up === "FEMALE" || up === "OTHER") return up;
  return g;
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      res.status(404);
      throw new Error("Patient profile not found");
    }

    return res.json({
      success: true,
      data: {
        ...patient.toObject(),
        email: user.email,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { error, value } = profileUpdateSchema.validate(req.body);
    if (error) {
      res.status(400);
      throw new Error(error.details[0].message);
    }

    const updateData = { ...value };
    updateData.gender = normalizeGender(updateData.gender);

    const allowedGenders = ["MALE", "FEMALE", "OTHER"];
    if (updateData.gender && !allowedGenders.includes(updateData.gender)) {
      res.status(400);
      throw new Error('Gender must be "Male", "Female", or "Other"');
    }

    const patient = await Patient.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!patient) {
      res.status(404);
      throw new Error("Patient profile not found");
    }

    res.json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
};

export const uploadProfilePhoto = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      res.status(404);
      throw new Error("Patient profile not found");
    }

    if (!req.file) {
      res.status(400);
      throw new Error("No file uploaded");
    }

    // `multer-storage-cloudinary` provides a permanent Cloudinary URL.
    const profilePhoto =
      req.file.secure_url || req.file.url || req.file.path || "";

    if (!profilePhoto) {
      res.status(400);
      throw new Error("Failed to process uploaded file");
    }

    patient.profilePhoto = profilePhoto;
    await patient.save();

    res.json({ success: true, data: { profilePhoto } });
  } catch (err) {
    res.status(500);
    res.json({ success: false, message: err.message || "Photo upload failed" });
  }
};

