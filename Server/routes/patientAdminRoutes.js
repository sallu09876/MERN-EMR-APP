import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  getPatientStats,
  getPatients,
  getPatientById,
  deletePatient,
} from "../controllers/patientAdminController.js";

const router = express.Router();

router.get("/", authenticate, authorizeRoles("SUPER_ADMIN"), getPatients);
router.get("/stats", authenticate, authorizeRoles("SUPER_ADMIN"), getPatientStats);
router.get("/:id", authenticate, authorizeRoles("SUPER_ADMIN"), getPatientById);
router.delete("/:id", authenticate, authorizeRoles("SUPER_ADMIN"), deletePatient);

export default router;

