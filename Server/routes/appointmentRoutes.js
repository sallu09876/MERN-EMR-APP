import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  createAppointment,
  getAppointments,
  updateAppointment,
  deleteAppointment,
  markArrived,
} from "../controllers/appointmentController.js";
import {
  availableSlots,
  patientBook,
  myAppointments,
  cancelMyAppointment,
} from "../controllers/patientAppointmentController.js";

const router = express.Router();

router.get(
  "/available-slots",
  authenticate,
  authorizeRoles("PATIENT"),
  availableSlots
);

router.post(
  "/patient-book",
  authenticate,
  authorizeRoles("PATIENT"),
  patientBook
);

router.get(
  "/my-appointments",
  authenticate,
  authorizeRoles("PATIENT"),
  myAppointments
);

router.delete(
  "/my-appointments/:id",
  authenticate,
  authorizeRoles("PATIENT"),
  cancelMyAppointment
);

// Create appointment: receptionist or super admin
router.post(
  "/",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "RECEPTIONIST"),
  createAppointment
);

// Get appointments: all roles (filtered in controller)
router.get(
  "/",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "DOCTOR", "RECEPTIONIST"),
  getAppointments
);

// Update & delete appointment: receptionist or super admin
router.put(
  "/:id",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "RECEPTIONIST"),
  updateAppointment
);

router.delete(
  "/:id",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "RECEPTIONIST"),
  deleteAppointment
);

// Mark arrived: receptionist or super admin
router.post(
  "/:id/arrive",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "RECEPTIONIST"),
  markArrived
);

export default router;

