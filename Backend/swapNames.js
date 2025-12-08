import mongoose from "mongoose";
import { User } from "./models/userSchema.js";
import dotenv from "dotenv";

dotenv.config({ path: "./config/config.env" });

const swapNames = async () => {
  try {
    // Kết nối database
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "HOSPITAL_MANAGEMENT_SYSTEM", // Thay bằng tên database của bạn
    });

    console.log("✅ Đã kết nối database");

    // Lấy tất cả users
    const users = await User.find({});
    console.log(`📊 Tìm thấy ${users.length} người dùng`);

    let updateCount = 0;

    // Đổi firstName ↔ lastName cho từng user
    for (const user of users) {
      const tempFirstName = user.firstName;
      const tempLastName = user.lastName;

      // Swap
      user.firstName = tempLastName;
      user.lastName = tempFirstName;

      await user.save();
      updateCount++;

      console.log(`✅ Đã cập nhật: ${tempFirstName} ${tempLastName} → ${user.firstName} ${user.lastName}`);
    }

    console.log(`\n🎉 Hoàn tất! Đã cập nhật ${updateCount}/${users.length} người dùng`);

    // Hiển thị kết quả
    console.log("\n📋 Dữ liệu sau khi cập nhật:");
    const updatedUsers = await User.find({}).select("firstName lastName role");
    updatedUsers.forEach(u => {
      console.log(`  - ${u.firstName} ${u.lastName} (${u.role})`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  }
};

swapNames();