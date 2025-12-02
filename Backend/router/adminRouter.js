import express from "express";
import {
  addNewAdmin,
  getUserDetails,
  logoutAdmin,
} from "../controller/userController.js";
import { isAdminAuthenticated } from "../middlewares/auth.js";

const router = express.Router();


router.post("/addnew", isAdminAuthenticated, addNewAdmin);

router.get("/me", isAdminAuthenticated, getUserDetails);


router.get("/logout", isAdminAuthenticated, logoutAdmin);

export default router;