import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import dotenv from "dotenv";
import fileUpload from "express-fileupload";

import userRouter from "./router/userRouter.js";
import doctorRouter from "./router/doctorRouter.js";
import appointmentRouter from "./router/appointmentRouter.js";
import xrayRouter from "./router/xrayRouter.js";
import messageRouter from "./router/messageRouter.js"; // nếu có file này

import { connectDB } from "./database/dbConnection.js";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";

const app = express();

// ✅ Load biến môi trường
dotenv.config({ path: "./config/config.env" });

// ✅ Middleware cơ bản
app.use(
  cors({
    origin: [process.env.FRONTEND_URL, process.env.DASHBOARD_URL],
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

// ✅ Mount các router
if (messageRouter) app.use("/api/v1/message", messageRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/doctor", doctorRouter);
app.use("/api/v1/appointment", appointmentRouter);
app.use("/api/v1/xray", xrayRouter);

// ✅ Kết nối DB
connectDB();

// ✅ Middleware xử lý lỗi
app.use(errorMiddleware);

export default app;