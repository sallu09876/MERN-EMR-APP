import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { getSlotsForDoctorAndDate } from "../services/slotService.js";

const router = express.Router();

router.get(
  "/",
  authenticate,
  authorizeRoles("SUPER_ADMIN", "DOCTOR", "RECEPTIONIST", "PATIENT"),
  async (req, res, next) => {
    try {
      const { doctorId, date } = req.query;

      if (!doctorId || !date) {
        res.status(400);
        throw new Error("doctorId and date are required");
      }

      const slots = await getSlotsForDoctorAndDate(doctorId, date);
      res.json({ success: true, data: slots });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

