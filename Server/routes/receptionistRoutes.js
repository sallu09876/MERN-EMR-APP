import express from "express";
import {
  getReceptionists,
  createReceptionist,
  updateReceptionist,
  deleteReceptionist
} from "../controllers/receptionistController.js";

const router = express.Router();

router.get("/receptionists", getReceptionists);
router.post("/receptionists", createReceptionist);
router.put("/receptionists/:id", updateReceptionist);
router.delete("/receptionists/:id", deleteReceptionist);

export default router;