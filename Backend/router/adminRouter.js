import express from "express";
import {
  addNewAdmin,
  getUserDetails,
  logoutAdmin,
} from "../controller/userController.js";
import { isAdminAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

// Thêm admin mới
router.post("/addnew", isAdminAuthenticated, addNewAdmin);

// Lấy thông tin admin hiện tại
router.get("/me", isAdminAuthenticated, getUserDetails);

// Đăng xuất admin
router.get("/logout", isAdminAuthenticated, logoutAdmin);

export default router;