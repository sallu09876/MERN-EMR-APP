import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

import {
  getProfile,
  updateProfile,
  uploadProfilePhoto,
} from "../controllers/patientPortalController.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

router.get("/profile", authenticate, authorizeRoles("PATIENT"), getProfile);
router.put("/profile", authenticate, authorizeRoles("PATIENT"), updateProfile);
router.post(
  "/profile/photo",
  authenticate,
  authorizeRoles("PATIENT"),
  upload.single("photo"),
  uploadProfilePhoto
);

export default router;

