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

const resolveRazorpayConfig = () => {
  // Prefer explicit mode; otherwise default to "test" outside production.
  const modeRaw = (process.env.RAZORPAY_MODE || "").trim().toLowerCase();
  const mode =
    modeRaw === "live" || modeRaw === "test"
      ? modeRaw
      : process.env.NODE_ENV === "production"
        ? "live"
        : "test";

  // Support both a mode-based env scheme and the legacy single-key scheme.
  const keyId =
    (mode === "live" ? process.env.RAZORPAY_KEY_ID_LIVE : process.env.RAZORPAY_KEY_ID_TEST) ||
    process.env.RAZORPAY_KEY_ID;
  const keySecret =
    (mode === "live"
      ? process.env.RAZORPAY_KEY_SECRET_LIVE
      : process.env.RAZORPAY_KEY_SECRET_TEST) || process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    const err = new Error(
      "Razorpay not configured. Set RAZORPAY_MODE and corresponding key env vars."
    );
    err.statusCode = 500;
    throw err;
  }

  // Enforce key/mode consistency to avoid Razorpay "merchant issue" checkout popups.
  if (mode === "test" && !String(keyId).startsWith("rzp_test_")) {
    const err = new Error(
      "Razorpay config mismatch: RAZORPAY_MODE=test requires RAZORPAY test key_id (rzp_test_...)."
    );
    err.statusCode = 500;
    throw err;
  }
  if (mode === "live" && !String(keyId).startsWith("rzp_live_")) {
    const err = new Error(
      "Razorpay config mismatch: RAZORPAY_MODE=live requires Razorpay live key_id (rzp_live_...)."
    );
    err.statusCode = 500;
    throw err;
  }

  // Guard: prevent accidental live-mode usage in dev which leads to confusing checkout failures.
  if (process.env.NODE_ENV !== "production" && String(keyId).startsWith("rzp_live_")) {
    const err = new Error(
      "Razorpay is using LIVE keys in development. Use TEST keys (rzp_test_...) or set RAZORPAY_MODE=test."
    );
    err.statusCode = 500;
    throw err;
  }

  return { mode, keyId, keySecret };
};

const getRazorpay = () => {
  const { keyId, keySecret } = resolveRazorpayConfig();
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
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

    const { keyId, mode } = resolveRazorpayConfig();
    const razorpay = getRazorpay();
    const amount = 10000;
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
      keyId,
      mode: process.env.NODE_ENV === "production" ? undefined : mode,
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
    const { keySecret } = resolveRazorpayConfig();

    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (expected !== razorpaySignature) {
      res.status(400);
      throw new Error("Payment verification failed (signature mismatch)");
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

