import express from "express";
import {
  diagnoseXray,
  getDiagnosisHistory,
  getDiagnosisById,
} from "../controller/xrayController.js";

import {
  isAdminAuthenticated,
  isPatientAuthenticated,
} from "../middlewares/auth.js";

const router = express.Router();

// API cho bệnh nhân gửi ảnh X-quang để phân tích
router.post("/diagnose", isPatientAuthenticated, diagnoseXray);

// API xem lịch sử chẩn đoán theo patientId
router.get("/history/:patientId", isPatientAuthenticated, getDiagnosisHistory);

// API xem chi tiết chẩn đoán theo id
router.get("/:id", isPatientAuthenticated, getDiagnosisById);



export default router;