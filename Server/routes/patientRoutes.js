import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { createPatient, searchPatients } from "../controllers/patientController.js";

const router = express.Router();

// Create patient (receptionist or super admin)
router.post(
  "/",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "RECEPTIONIST"),
  createPatient
);

// Search patients (all roles)
router.get(
  "/search",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "DOCTOR", "RECEPTIONIST"),
  searchPatients
);

export default router;

