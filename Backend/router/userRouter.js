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
  getPatientProfile,
} from "../controller/userController.js";

import {
  deleteAppointment,
  getAllAppointments,
  postAppointment,
  updateAppointmentStatus,
} from "../controller/appointmentController.js";

import {
  isAdminAuthenticated,
  isPatientAuthenticated,
} from "../middlewares/auth.js";

const router = express.Router();

// ---------------- Patient ----------------
router.post("/patient/register", patientRegister);
router.get("/patient/me", isPatientAuthenticated, getUserDetails);
router.get("/patient/logout", isPatientAuthenticated, logoutPatient);
router.get("/patient/profile", isPatientAuthenticated, getPatientProfile);

// ---------------- Admin ----------------
router.post("/admin/addnew", isAdminAuthenticated, addNewAdmin);
router.get("/admin/me", isAdminAuthenticated, getUserDetails);
router.get("/admin/logout", isAdminAuthenticated, logoutAdmin);

// ---------------- Doctors ----------------
router.get("/doctor", getAllDoctors);
router.post("/doctor", isAdminAuthenticated, addNewDoctor);
router.delete("/doctor/:id", isAdminAuthenticated, deleteDoctor);

// ---------------- Appointments ----------------
router.post("/appointment/new", isPatientAuthenticated, postAppointment);
router.get("/appointment/getall", isAdminAuthenticated, getAllAppointments);
router.put("/appointment/update/:id", isAdminAuthenticated, updateAppointmentStatus);
router.delete("/appointment/delete/:id", isPatientAuthenticated, deleteAppointment);

// ---------------- Auth ----------------
router.post("/login", loginUser);

export default router;