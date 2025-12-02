import express from "express";
import { getAllMessages, sendMessage } from "../controller/messageController.js";
import {isAdminAuthenticated} from "../middlewares/auth.js";
import { deleteMessage } from "../controller/messageController.js";


const router = express.Router();

router.post("/send", sendMessage);
router.get("/getall", isAdminAuthenticated,getAllMessages)

router.delete("/delete/:id", isAdminAuthenticated, deleteMessage);

export default router;