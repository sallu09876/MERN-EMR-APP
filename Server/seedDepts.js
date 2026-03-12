import mongoose from "mongoose";
import dotenv from "dotenv";
import { seedDepartments } from "./controllers/departmentController.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await seedDepartments();
  console.log("Done");
  process.exit(0);
});