import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { createOrder, verifyPayment, paymentFailed } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-order", authenticate, authorizeRoles("PATIENT"), createOrder);
router.post("/verify", authenticate, authorizeRoles("PATIENT"), verifyPayment);
router.post("/failed", authenticate, authorizeRoles("PATIENT"), paymentFailed);

export default router;

