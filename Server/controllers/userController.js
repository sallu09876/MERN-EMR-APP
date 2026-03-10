import User from "../models/User.js";
import Receptionist from "../models/Receptionist.js";

export const getReceptionists = async (req, res, next) => {
  try {
    const users = await User.find({ role: "RECEPTIONIST" }).select("-password");
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

export const createReceptionist = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Save to users collection (for login) — pre('save') hook hashes password
    const user = new User({ name, email, password, role: "RECEPTIONIST" });
    await user.save();

    // Also save to receptionists collection (mirror record, store hashed password)
    await Receptionist.create({
      name,
      email,
      password: user.password, // already hashed by the User pre-save hook
    });

    res.status(201).json({
      success: true,
      data: { _id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    if (err.code === 11000) {
      res.status(409);
      return next(new Error("Email already exists"));
    }
    next(err);
  }
};

export const deleteReceptionist = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    // Also remove from receptionists collection
    if (user) {
      await Receptionist.findOneAndDelete({ email: user.email });
    }
    res.json({ success: true, message: "Receptionist removed" });
  } catch (err) {
    next(err);
  }
};
