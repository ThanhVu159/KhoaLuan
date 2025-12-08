import express from "express";
import {
  addNewDoctor,
  deleteDoctor,
  getAllDoctors,
  getUserDetails,
  logoutPatient,
  patientRegister,
  login,
  getAdminDetails,
  logoutAdmin,
  addNewAdmin,
  getUserProfile,
} from "../controller/userController.js";

import {
  deleteAppointment,
  getAllAppointments,
  postAppointment,
  updateAppointmentStatus,
} from "../controller/appointmentController.js";

import {
  isAuthenticated,
  isAdminAuthenticated,
  isPatientAuthenticated,
  isAuthorized,
} from "../middlewares/auth.js";

const router = express.Router();

// ---------------- Patient ----------------
router.post("/register", patientRegister);
router.post("/login", login);
router.get("/me", isPatientAuthenticated, getUserDetails); 
router.get("/profile", isPatientAuthenticated, getUserProfile); 
router.get("/logout", logoutPatient); 

// ---------------- Admin ----------------
router.get("/admin/me", isAdminAuthenticated, getAdminDetails);
router.get("/admin/logout", logoutAdmin);
router.post("/admin/addnew", isAdminAuthenticated, addNewAdmin);

// ---------------- Doctors ----------------
router.get("/doctor", getAllDoctors);
router.post("/doctor", isAdminAuthenticated, addNewDoctor);
router.delete("/doctor/:id", isAdminAuthenticated, deleteDoctor);

// ---------------- Appointments ----------------
router.post("/appointment/new", isPatientAuthenticated, postAppointment);
router.get(
  "/appointment/getall",
  isAuthenticated,
  isAuthorized("Admin", "Doctor", "Patient"),
  getAllAppointments
);
router.put("/appointment/update/:id", isAdminAuthenticated, updateAppointmentStatus);
router.delete("/appointment/delete/:id", isPatientAuthenticated, deleteAppointment);

export default router;