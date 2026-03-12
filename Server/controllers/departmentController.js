import Department from "../models/Department.js";

const DEFAULT_DEPTS = [
  "Cardiology","Neurology","Orthopedics","Pediatrics","Dermatology",
  "Oncology","Radiology","General Medicine","ENT","Ophthalmology",
  "Psychiatry","Gynecology","Urology"
];

// Seed defaults — adds any missing defaults without touching existing ones
export const seedDepartments = async () => {
  try {
    for (const name of DEFAULT_DEPTS) {
      const exists = await Department.findOne({ name: { $regex: `^${name}$`, $options: "i" } });
      if (!exists) {
        await Department.create({ name, isDefault: true });
      }
    }
    console.log("✅ Default departments ensured");
  } catch (err) {
    console.error("Department seed error:", err.message);
  }
};

// GET /api/departments
export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json({ success: true, data: departments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/departments
export const createDepartment = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "Department name is required" });
    }
    const exists = await Department.findOne({ name: { $regex: `^${name.trim()}$`, $options: "i" } });
    if (exists) {
      return res.status(409).json({ success: false, message: "Department already exists" });
    }
    const dept = await Department.create({ name: name.trim() });
    res.status(201).json({ success: true, data: dept });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/departments/:id
export const deleteDepartment = async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }
    await dept.deleteOne();
    res.json({ success: true, message: "Department deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
