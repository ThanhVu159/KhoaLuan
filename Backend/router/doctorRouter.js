import express from "express";
import {
  addNewDoctor,
  deleteDoctor,
  getAllDoctors,
} from "../controller/userController.js";
import {
  isAuthenticated,
  isAdminAuthenticated,
  isAuthorized,
} from "../middlewares/auth.js";

const router = express.Router();

// ✅ Cho phép Admin, Bác sĩ và Bệnh nhân xem danh sách bác sĩ
router.get(
  "/",
  isAuthenticated, // gán req.user từ token
  isAuthorized("Admin", "Doctor", "Patient"),
  getAllDoctors
);

// ✅ Chỉ Admin mới được thêm bác sĩ
router.post("/addnew", isAdminAuthenticated, addNewDoctor);

// ✅ Chỉ Admin mới được xoá bác sĩ
router.delete("/:id", isAdminAuthenticated, deleteDoctor);

export default router;