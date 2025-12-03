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
  getUserProfile, // thêm hàm mới
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
router.post("/patient/register", patientRegister);
router.post("/login", login);
router.get("/patient/me", isPatientAuthenticated, getUserDetails);
router.get("/patient/logout", isPatientAuthenticated, logoutPatient);

// ✅ route mới để lấy hồ sơ bệnh nhân kèm lịch hẹn
router.get("/me", isPatientAuthenticated, getUserProfile);

// ---------------- Admin ----------------
router.get("/admin/me", isAdminAuthenticated, getAdminDetails);
router.get("/admin/logout", isAdminAuthenticated, logoutAdmin);
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