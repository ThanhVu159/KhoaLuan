import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import dotenv from "dotenv";

// ✅ Import router từ thư mục đúng
import userRoutes from "./router/userRouter.js";
import doctorRoutes from "./router/doctorRouter.js";
import adminRoutes from "./router/adminRouter.js";

dotenv.config();

const app = express();


app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));


app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev")); 


app.use("/api/v1/user", userRoutes);
app.use("/api/v1/doctors", doctorRoutes);
app.use("/api/v1/admin", adminRoutes);


app.get("/", (req, res) => {
  res.send("API đang chạy...");
});

export default app;