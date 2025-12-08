import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, "config", "config.env");

// ✅ Load biến môi trường
dotenv.config({ path: envPath });

import app from "./app.js";
import cloudinary from "cloudinary";
import { connectDB } from "./database/dbConnection.js";

// ✅ Kết nối DB (chỉ gọi 1 lần ở đây)
connectDB();

// ✅ Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Log để kiểm tra Cloudinary đã kết nối
console.log("✅ Cloudinary configured:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? "***" : "MISSING",
  api_secret: process.env.CLOUDINARY_API_SECRET ? "***" : "MISSING",
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);
});