import bcrypt from "bcryptjs";
import User from "../models/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/tokenUtils.js";
import { logAction } from "../services/logService.js";

const REFRESH_COOKIE_NAME = "emr_refresh_token";

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error("Email and password are required");
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      await logAction({
        userId: null,
        role: null,
        action: "LOGIN_FAILED",
        entity: `email:${email}`,
      });
      res.status(401);
      throw new Error("Invalid credentials");
    }

    if (user.role === "PATIENT") {
      res.status(403);
      throw new Error("Please use the Patient Portal login");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await logAction({
        userId: user._id,
        role: user.role,
        action: "LOGIN_FAILED",
        entity: `user:${user._id}`,
      });
      res.status(401);
      throw new Error("Invalid credentials");
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await logAction({
      userId: user._id,
      role: user.role,
      action: "LOGIN_SUCCESS",
      entity: `user:${user._id}`,
    });

    res.json({
      success: true,
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies[REFRESH_COOKIE_NAME];
    if (!token) {
      res.status(401);
      throw new Error("No refresh token");
    }

    const decoded = verifyRefreshToken(token);

    const user = await User.findById(decoded.sub);
    if (!user) {
      res.status(401);
      throw new Error("User not found");
    }

    const accessToken = generateAccessToken(user);

    res.json({
      success: true,
      accessToken,
    });
  } catch (error) {
    res.status(401);
    next(new Error("Invalid refresh token"));
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
  } catch (error) {
    next(error);
  }
};
