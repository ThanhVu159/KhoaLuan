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
} from "../middlewares/auth.js";

const router = express.Router();

router.post("/post", isPatientAuthenticated, postAppointment);
router.get("/getall", isPatientAuthenticated, getAllAppointments);
router.put("/update/:id", isAdminAuthenticated, updateAppointmentStatus);
router.delete("/delete/:id", isPatientAuthenticated, deleteAppointment); 

export default router;