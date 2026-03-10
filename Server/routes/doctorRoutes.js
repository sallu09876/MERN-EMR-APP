import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  getDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from "../controllers/doctorController.js";

const router = express.Router();

// View doctors: all authenticated roles
router.get(
  "/",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "DOCTOR", "RECEPTIONIST"),
  getDoctors
);

// Manage doctors: SUPER_ADMIN only
router.post("/", authenticate, authorizeRoles("SUPER_ADMIN"), createDoctor);
router.put("/:id", authenticate, authorizeRoles("SUPER_ADMIN"), updateDoctor);
router.delete("/:id", authenticate, authorizeRoles("SUPER_ADMIN"), deleteDoctor);

export default router;

