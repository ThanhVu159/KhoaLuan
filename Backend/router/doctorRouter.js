import express from "express";
import {
  addNewDoctor,
  deleteDoctor,
  getAllDoctors,
} from "../controller/userController.js";
import { isAdminAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", getAllDoctors);


router.post("/addnew", isAdminAuthenticated, addNewDoctor);


router.delete("/:id", isAdminAuthenticated, deleteDoctor);

export default router;