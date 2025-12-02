import express from "express";
import { loginUser } from "../controller/authController.js";

import {
  addNewAdmin,
  addNewDoctor,
  deleteDoctor,
  getAllDoctors,
  getUserDetails,
  logoutAdmin,
  logoutPatient,
  patientRegister,
} from "../controller/userController.js";

import {
  isAdminAuthenticated,
  isPatientAuthenticated,
} from "../middlewares/auth.js";

const router = express.Router();

// ---------------- Patient ----------------
router.post("/patient/register", patientRegister);
router.get("/patient/me", isPatientAuthenticated, getUserDetails);
router.get("/patient/logout", isPatientAuthenticated, logoutPatient);

// ---------------- Admin ----------------
router.post("/admin/addnew", isAdminAuthenticated, addNewAdmin);
router.get("/admin/me", isAdminAuthenticated, getUserDetails);
router.get("/admin/logout", isAdminAuthenticated, logoutAdmin);

// ---------------- Doctors ----------------
router.get("/doctor", getAllDoctors);
router.post("/doctor", isAdminAuthenticated, addNewDoctor);
router.delete("/doctor/:id", isAdminAuthenticated, deleteDoctor);

// ---------------- Auth ----------------
router.post("/login", loginUser);

export default router;