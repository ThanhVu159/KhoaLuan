import mongoose from "mongoose";

export const connectDB = async () => {
  try {

    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI chưa được định nghĩa trong config.env");
    }

    console.log("🔍 MONGO_URI:", process.env.MONGO_URI);

    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "AI-Medical",
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Đã kết nối MongoDB thành công!");
  } catch (err) {
    console.error("❌ Lỗi kết nối MongoDB:", err.message);
    process.exit(1); 
  }
};