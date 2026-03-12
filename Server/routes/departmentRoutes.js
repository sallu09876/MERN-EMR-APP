import express from "express";
import {
  getDepartments,
  createDepartment,
  deleteDepartment,
} from "../controllers/departmentController.js";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Anyone logged in can fetch departments (doctors, receptionists, admins all need this)
router.get("/", authenticate, getDepartments);

// Only Super Admin can add or remove departments
router.post("/", authenticate, authorizeRoles("SUPER_ADMIN"), createDepartment);
router.delete("/:id", authenticate, authorizeRoles("SUPER_ADMIN"), deleteDepartment);

export default router;
