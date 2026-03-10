import Joi from "joi";
import Patient from "../models/Patient.js";

const patientSchema = Joi.object({
  name: Joi.string().trim().required(),
  mobile: Joi.string().trim().required(),
  email: Joi.string().email().trim().allow(null, "").optional(),
  dob: Joi.date().optional(),
  gender: Joi.string().valid("MALE", "FEMALE", "OTHER").optional(),
});

export const createPatient = async (req, res, next) => {
  try {
    const { error, value } = patientSchema.validate(req.body);
    if (error) {
      res.status(400);
      throw new Error(error.details[0].message);
    }

    const patient = await Patient.create(value);
    res.status(201).json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
};

export const searchPatients = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.json({ success: true, data: [] });
    }

    const regex = new RegExp(query, "i");

    // Only attempt _id search if the query looks like a valid MongoDB ObjectId
    const isObjectId = /^[a-f\d]{24}$/i.test(query);

    const orConditions = [{ name: regex }, { mobile: regex }];
    if (isObjectId) orConditions.push({ _id: query });

    const patients = await Patient.find({ $or: orConditions })
      .limit(20)
      .sort({ createdAt: -1 });

    res.json({ success: true, data: patients });
  } catch (err) {
    next(err);
  }
};

