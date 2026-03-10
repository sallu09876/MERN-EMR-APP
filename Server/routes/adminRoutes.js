import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  getReceptionists,
  createReceptionist,
  deleteReceptionist,
} from "../controllers/userController.js";
import { getSystemStats } from "../controllers/adminController.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

const router = express.Router();

router.get(
  "/receptionists",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  getReceptionists
);

router.post(
  "/receptionists",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  createReceptionist
);

router.put(
  "/receptionists/:id",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  async (req, res, next) => {
    try {
      const { name, email } = req.body;
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { name, email },
        { new: true, runValidators: true }
      ).select("-password");
      if (!user) { res.status(404); throw new Error("Receptionist not found"); }
      res.json({ success: true, data: user });
    } catch (err) { next(err); }
  }
);

router.delete(
  "/receptionists/:id",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  deleteReceptionist
);

router.get(
  "/stats",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  getSystemStats
);

export default router;
