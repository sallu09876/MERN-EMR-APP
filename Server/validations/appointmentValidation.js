import Joi from "joi";

export const appointmentCreateSchema = Joi.object({
  doctorId: Joi.string().hex().length(24).required(),
  appointmentDate: Joi.date().required(),
  slotStartTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  slotEndTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  purpose: Joi.string().allow("", null).optional(),
  notes: Joi.string().allow("", null).optional(),
  patientType: Joi.string().valid("NEW", "EXISTING").required(),
  patientId: Joi.string().hex().length(24).when("patientType", {
    is: "EXISTING",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  patient: Joi.when("patientType", {
    is: "NEW",
    then: Joi.object({
      name: Joi.string().required(),
      mobile: Joi.string().required(),
      email: Joi.string().email().allow("", null).optional(),
      dob: Joi.date().optional(),
      gender: Joi.string().valid("MALE", "FEMALE", "OTHER").optional(),
    }).required(),
    otherwise: Joi.optional(),
  }),
});

export const appointmentUpdateSchema = Joi.object({
  purpose: Joi.string().allow("", null).optional(),
  notes: Joi.string().allow("", null).optional(),
  status: Joi.string()
    .valid("BOOKED", "ARRIVED", "COMPLETED", "CANCELLED")
    .optional(),
});

