import express from "express";
import {
  postAppointment,
  getAllAppointments,
  updateAppointmentStatus,
  deleteAppointment,
} from "../controller/appointmentController.js";
import {
  isAdminAuthenticated,
  isPatientAuthenticated,
  isAuthenticated,
  isAuthorized,
} from "../middlewares/auth.js";

const router = express.Router();

// Bệnh nhân đặt lịch hẹn
router.post("/new", isPatientAuthenticated, postAppointment);

// Cho phép cả Admin, Bác sĩ và Bệnh nhân xem danh sách hẹn
router.get(
  "/getall",
  isAuthenticated,
  isAuthorized("Admin", "Doctor", "Patient"),
  getAllAppointments
);

// Admin cập nhật trạng thái lịch hẹn
router.put("/update/:id", isAdminAuthenticated, updateAppointmentStatus);

// ✅ Cho phép Admin, Doctor và Patient xóa lịch hẹn
router.delete(
  "/delete/:id", 
  isAuthenticated,
  isAuthorized("Admin", "Doctor", "Patient"),
  deleteAppointment
);

export default router;