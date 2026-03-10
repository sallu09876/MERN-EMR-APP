import Receptionist from "../models/Receptionist.js";
import bcrypt from "bcrypt";

export const getReceptionists = async (req, res, next) => {
  try {
    const receptionists = await Receptionist.find()
      .select("-password")
      .sort({ name: 1 });

    res.json({
      success: true,
      data: receptionists,
    });
  } catch (error) {
    next(error);
  }
};

export const createReceptionist = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const receptionist = await Receptionist.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      success: true,
      data: receptionist,
    });
  } catch (error) {
    next(error);
  }
};

export const updateReceptionist = async (req, res, next) => {
  try {
    const receptionist = await Receptionist.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );

    res.json({
      success: true,
      data: receptionist,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteReceptionist = async (req, res, next) => {
  try {
    await Receptionist.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Receptionist deleted",
    });
  } catch (error) {
    next(error);
  }
};
