import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Joi from "joi";

import User from "../models/User.js";
import Patient from "../models/Patient.js";
import OTP from "../models/OTP.js";

import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokenUtils.js";
import { sendMail } from "../config/mailer.js";
import {
  otpTemplate,
  welcomeTemplate,
  loginAlertTemplate,
  passwordChangedTemplate,
} from "../config/emailTemplates.js";

const REFRESH_COOKIE_NAME = "emr_refresh_token";

const resetTokenType = "PATIENT_PASSWORD_RESET";

const registerSchema = Joi.object({
  name: Joi.string().trim().required(),
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().min(6).required(),
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
  otp: Joi.string().pattern(/^\d{6}$/).required(),
  purpose: Joi.string().valid("SIGNUP", "FORGOT_PASSWORD", "LOGIN_ALERT").required(),
});

const resendOtpSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
  purpose: Joi.string().valid("SIGNUP", "FORGOT_PASSWORD").required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
  password: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().required(),
});

const resetPasswordSchema = Joi.object({
  resetToken: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

const generateOtpCode = () => {
  // Ensures 6 digits with leading zeros possible.
  const num = crypto.randomInt(0, 1000000);
  return String(num).padStart(6, "0");
};

const signResetToken = (email) => {
  const secret = process.env.JWT_RESET_SECRET || process.env.JWT_ACCESS_SECRET;
  return jwt.sign({ email, type: resetTokenType }, secret, { expiresIn: "15m" });
};

const verifyResetToken = (token) => {
  const secret = process.env.JWT_RESET_SECRET || process.env.JWT_ACCESS_SECRET;
  const decoded = jwt.verify(token, secret);
  if (!decoded || decoded.type !== resetTokenType) {
    const err = new Error("Invalid reset token");
    err.statusCode = 400;
    throw err;
  }
  return decoded;
};

const issueTokens = (res, user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return { accessToken };
};

export const register = async (req, res, next) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      res.status(400);
      throw new Error(error.details[0].message);
    }

    const { name, email, password } = value;

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409);
      throw new Error("Email already exists");
    }

    const passwordHash = await bcrypt.hash(password, await bcrypt.genSalt(10));
    const otpCode = generateOtpCode();
    const otpHash = await bcrypt.hash(otpCode, await bcrypt.genSalt(10));

    await OTP.create({
      email,
      otp: otpHash,
      purpose: "SIGNUP",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      name,
      passwordHash,
    });

    await sendMail({
      to: email,
      subject: "MedFlow · Your verification code",
      html: otpTemplate(otpCode, "SIGNUP"),
    });

    res.json({ success: true, message: "OTP sent to your email" });
  } catch (err) {
    next(err);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { error, value } = verifyOtpSchema.validate(req.body);
    if (error) {
      res.status(400);
      throw new Error(error.details[0].message);
    }

    const { email, otp, purpose } = value;

    const otpDoc = await OTP.findOne({ email, purpose }).sort({ createdAt: -1 });
    if (!otpDoc || otpDoc.used) {
      res.status(400);
      throw new Error("OTP expired. Request a new one");
    }

    if (otpDoc.expiresAt <= new Date()) {
      res.status(400);
      throw new Error("OTP expired. Request a new one");
    }

    const isMatch = await bcrypt.compare(otp, otpDoc.otp);
    if (!isMatch) {
      res.status(400);
      throw new Error("Invalid OTP");
    }

    otpDoc.used = true;
    await otpDoc.save();

    if (purpose === "SIGNUP") {
      const { name, passwordHash } = otpDoc;
      if (!name || !passwordHash) {
        res.status(400);
        throw new Error("Invalid signup request. Please register again.");
      }

      const user = await User.create({
        name,
        email,
        password: passwordHash, // pre-save hook will detect bcrypt format and skip re-hashing.
        role: "PATIENT",
      });

      const patient = await Patient.create({
        userId: user._id,
        name,
        email,
        isVerified: true,
      });

      // Welcome email async; do not block signup.
      void sendMail({
        to: email,
        subject: "MedFlow · Welcome aboard",
        html: welcomeTemplate(patient.name),
      }).catch(() => {});

      const { accessToken } = issueTokens(res, user);

      return res.json({
        success: true,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        accessToken,
      });
    }

    if (purpose === "FORGOT_PASSWORD") {
      const decoded = signResetToken(email);
      return res.json({ success: true, resetToken: decoded });
    }

    // LOGIN_ALERT is currently not used in this flow.
    res.status(400);
    throw new Error("Unsupported OTP purpose");
  } catch (err) {
    next(err);
  }
};

export const resendOtp = async (req, res, next) => {
  try {
    const { error, value } = resendOtpSchema.validate(req.body);
    if (error) {
      res.status(400);
      throw new Error(error.details[0].message);
    }

    const { email, purpose } = value;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const otpCount = await OTP.countDocuments({
      email,
      purpose,
      createdAt: { $gte: oneHourAgo },
    });

    if (otpCount >= 3) {
      res.status(429);
      throw new Error("OTP resend limit reached. Try again later.");
    }

    const latestSignupContext =
      purpose === "SIGNUP"
        ? await OTP.findOne({ email, purpose }).sort({ createdAt: -1 })
        : null;

    const otpCode = generateOtpCode();
    const otpHash = await bcrypt.hash(otpCode, await bcrypt.genSalt(10));

    await OTP.create({
      email,
      otp: otpHash,
      purpose,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      name: purpose === "SIGNUP" ? latestSignupContext?.name : undefined,
      passwordHash: purpose === "SIGNUP" ? latestSignupContext?.passwordHash : undefined,
    });

    await sendMail({
      to: email,
      subject:
        purpose === "SIGNUP" ? "MedFlow · Your verification code" : "MedFlow · Reset your password",
      html: otpTemplate(otpCode, purpose),
    });

    res.json({ success: true, message: "OTP resent" });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      res.status(400);
      throw new Error(error.details[0].message);
    }

    const { email, password } = value;

    const user = await User.findOne({ email, role: "PATIENT" }).select("+password");
    if (!user) {
      res.status(401);
      throw new Error("Invalid credentials");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401);
      throw new Error("Invalid credentials");
    }

    const patient = await Patient.findOne({ userId: user._id });
    if (!patient || !patient.isVerified) {
      res.status(403);
      throw new Error("Please verify your email first");
    }

    const { accessToken } = issueTokens(res, user);

    // Send login alert async (do not block).
    void sendMail({
      to: email,
      subject: "MedFlow · Login alert",
      html: loginAlertTemplate(user.name, new Date().toLocaleString()),
    }).catch(() => {});

    res.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) {
      res.status(400);
      throw new Error(error.details[0].message);
    }

    const { email } = value;

    // Security: do not reveal whether the account exists.
    const user = await User.findOne({ email, role: "PATIENT" });

    if (user) {
      const otpCode = generateOtpCode();
      const otpHash = await bcrypt.hash(otpCode, await bcrypt.genSalt(10));

      await OTP.create({
        email,
        otp: otpHash,
        purpose: "FORGOT_PASSWORD",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      await sendMail({
        to: email,
        subject: "MedFlow · Your reset code",
        html: otpTemplate(otpCode, "FORGOT_PASSWORD"),
      });
    }

    res.json({ success: true, message: "OTP sent if account exists" });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      res.status(400);
      throw new Error(error.details[0].message);
    }

    const { resetToken, newPassword } = value;
    const decoded = verifyResetToken(resetToken);
    const { email } = decoded;

    const user = await User.findOne({ email, role: "PATIENT" });
    if (!user) {
      res.status(404);
      throw new Error("Account not found");
    }

    user.password = newPassword; // pre-save hook will hash raw password.
    await user.save();

    void sendMail({
      to: email,
      subject: "MedFlow · Password changed",
      html: passwordChangedTemplate(user.name),
    }).catch(() => {});

    res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      res.status(400);
      throw new Error(error.details[0].message);
    }

    const { currentPassword, newPassword } = value;
    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(401);
      throw new Error("Current password is incorrect");
    }

    user.password = newPassword;
    await user.save();

    void sendMail({
      to: user.email,
      subject: "MedFlow · Password changed",
      html: passwordChangedTemplate(user.name),
    }).catch(() => {});

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    res.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

