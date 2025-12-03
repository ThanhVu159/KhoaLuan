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
//  đổi từ "/post" thành "/new" để khớp với FE
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

// Bệnh nhân xoá lịch hẹn của mình
router.delete("/delete/:id", isPatientAuthenticated, deleteAppointment);
// ✅ Xuất mặc định để app.js import được
export default router;