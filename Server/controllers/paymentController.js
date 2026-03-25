import Joi from "joi";
import crypto from "crypto";
import Razorpay from "razorpay";

import Appointment from "../models/Appointment.js";
import Patient from "../models/Patient.js";
import Payment from "../models/Payment.js";
import Doctor from "../models/Doctor.js";
import { getSlotsForDoctorAndDate } from "../services/slotService.js";
import { sendMail } from "../config/mailer.js";
import { appointmentConfirmTemplate } from "../config/emailTemplates.js";

const createOrderSchema = Joi.object({
  doctorId: Joi.string().hex().length(24).required(),
  appointmentDate: Joi.date().required(),
  slotStartTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  slotEndTime: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
});

const verifySchema = Joi.object({
  orderId: Joi.string().required(),
  paymentId: Joi.string().required(),
  razorpaySignature: Joi.string().required(),
});

const failedSchema = Joi.object({
  orderId: Joi.string().required(),
});

const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    const err = new Error("Razorpay not configured");
    err.statusCode = 500;
    throw err;
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

export const createOrder = async (req, res, next) => {
  try {
    const { error, value } = createOrderSchema.validate(req.body);
    if (error) {
      res.status(400);
      throw new Error(error.details[0].message);
    }

    const { doctorId, appointmentDate, slotStartTime, slotEndTime } = value;

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      res.status(404);
      throw new Error("Patient profile not found");
    }

    const slots = await getSlotsForDoctorAndDate(doctorId, appointmentDate);
    const selected = slots.find(
      (s) => s.start === slotStartTime && s.end === slotEndTime && s.status === "AVAILABLE"
    );
    if (!selected) {
      res.status(409);
      throw new Error("Slot no longer available");
    }

    const razorpay = getRazorpay();
    const amount = 100; // paise = ₹1
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
    });

    await Payment.create({
      patientId: patient._id,
      razorpayOrderId: order.id,
      amount,
      currency: "INR",
      status: "PENDING",
      doctorId,
      appointmentDate: new Date(appointmentDate),
      slotStartTime,
      slotEndTime,
    });

    res.json({
      success: true,
      orderId: order.id,
      amount,
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    next(err);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const { error, value } = verifySchema.validate(req.body);
    if (error) {
      res.status(400);
      throw new Error(error.details[0].message);
    }

    const { orderId, paymentId, razorpaySignature } = value;

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (expected !== razorpaySignature) {
      res.status(400);
      throw new Error("Payment verification failed");
    }

    const payment = await Payment.findOne({ razorpayOrderId: orderId }).populate("patientId");
    if (!payment) {
      res.status(404);
      throw new Error("Payment record not found");
    }

    // Ensure payment belongs to this patient user.
    if (String(payment.patientId.userId) !== String(req.user._id)) {
      res.status(403);
      throw new Error("Forbidden");
    }

    payment.status = "PAID";
    payment.razorpayPaymentId = paymentId;
    await payment.save();

    // Re-check slot availability to avoid double-book race.
    const slots = await getSlotsForDoctorAndDate(payment.doctorId, payment.appointmentDate);
    const selected = slots.find(
      (s) =>
        s.start === payment.slotStartTime &&
        s.end === payment.slotEndTime &&
        s.status === "AVAILABLE"
    );
    if (!selected) {
      payment.status = "FAILED";
      await payment.save();

      res.status(409);
      throw new Error("Slot no longer available");
    }

    let appointment;
    try {
      appointment = await Appointment.create({
        doctorId: payment.doctorId,
        patientId: payment.patientId._id,
        appointmentDate: payment.appointmentDate,
        slotStartTime: payment.slotStartTime,
        slotEndTime: payment.slotEndTime,
        status: "BOOKED",
        createdBy: req.user._id,
        bookedBy: "PATIENT",
        paymentId,
        paymentStatus: "PAID",
      });
    } catch (err) {
      if (err?.code === 11000) {
        payment.status = "FAILED";
        await payment.save();
        res.status(409);
        throw new Error("Slot no longer available");
      }
      throw err;
    }

    const patient = await Patient.findById(payment.patientId._id);
    const doctor = await Doctor.findById(payment.doctorId);

    void sendMail({
      to: patient.email || "",
      subject: "MedFlow · Appointment confirmed",
      html: appointmentConfirmTemplate(
        patient.name,
        doctor?.name || "Our Doctor",
        formatDate(payment.appointmentDate),
        `${payment.slotStartTime}–${payment.slotEndTime}`
      ),
    }).catch(() => {});

    payment.appointmentId = appointment._id;
    await payment.save();

    return res.json({ success: true, data: appointment });
  } catch (err) {
    next(err);
  }
};

export const paymentFailed = async (req, res, next) => {
  try {
    const { error, value } = failedSchema.validate(req.body);
    if (error) {
      res.status(400);
      throw new Error(error.details[0].message);
    }

    const { orderId } = value;

    const payment = await Payment.findOne({ razorpayOrderId: orderId }).populate("patientId");
    if (!payment) return res.json({ success: true });

    if (String(payment.patientId.userId) !== String(req.user._id)) {
      res.status(403);
      throw new Error("Forbidden");
    }

    payment.status = "FAILED";
    await payment.save();

    return res.json({ success: true, message: "Payment marked as failed" });
  } catch (err) {
    next(err);
  }
};

