import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import {
  getRevenueChart,
  getRecentPaidBookings,
  getRevenueStats,
} from "../controllers/revenueController.js";

const router = express.Router();

router.get(
  "/stats",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  getRevenueStats
);

router.get(
  "/recent",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  getRecentPaidBookings
);

router.get(
  "/chart",
  authenticate,
  authorizeRoles("SUPER_ADMIN"),
  getRevenueChart
);

export default router;

