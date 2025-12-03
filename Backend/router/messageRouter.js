import express from "express";
import {
  getAllMessages,
  sendMessage,
  deleteMessage,
} from "../controller/messageController.js";
import { isAdminAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

// ------------------------------
//  Bệnh nhân gửi tin nhắn
// ------------------------------
router.post("/send", sendMessage);

// ------------------------------
//  Admin lấy tất cả tin nhắn
// ------------------------------
router.get("/getall", isAdminAuthenticated, getAllMessages);

// ------------------------------
//  Admin xoá tin nhắn
// ------------------------------
router.delete("/delete/:id", isAdminAuthenticated, deleteMessage);

export default router;