import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "..", "uploads");
const patientsUploadsDir = path.join(uploadsDir, "patients");

const shouldUseCloudinary = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"].every((k) => {
  const v = process.env[k];
  if (!v) return false;
  const up = String(v).toUpperCase();
  // Avoid accidentally enabling Cloudinary with template placeholder values.
  if (up.includes("YOUR_")) return false;
  return true;
});

let storage;

if (shouldUseCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "medflow/patients",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    },
  });
} else {
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      fs.mkdirSync(patientsUploadsDir, { recursive: true });
      cb(null, patientsUploadsDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const base = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]/gi, "");
      const finalBase = base || "patient";
      const finalName = `${Date.now()}-${Math.random().toString(16).slice(2)}-${finalBase}${ext}`;
      cb(null, finalName);
    },
  });
}

export const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error("Only image files (jpg, jpeg, png, webp) are allowed"));
  },
});

export const uploadsPublicPath = "/uploads";
export const patientsUploadsSubPath = "patients";

