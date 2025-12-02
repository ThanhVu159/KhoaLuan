import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "Bắt buộc phải nhập tên"],
    minLength: [3, "Tên phải chứa ít nhất 3 ký tự!"],
  },
  lastName: {
    type: String,
    required: [true, "Họ là bắt buộc!"],
    minLength: [2, "Họ phải chứa ít nhất 2 ký tự!"],
  },
  email: {
    type: String,
    required: [true, "Email là bắt buộc"],
    validate: [validator.isEmail, "Cung cấp email hợp lệ"],
    unique: true,
  },
  phone: {
    type: String,
    required: [true, "Cần có số điện thoại!"],
    minLength: [9, "Số điện thoại phải chứa ít nhất 9 chữ số"],
    maxLength: [11, "Số điện thoại không được quá 11 chữ số"],
  },
  dob: {
    type: Date,
    required: [true, "Ngày sinh là bắt buộc"],
  },
  gender: {
    type: String,
    required: [true, "Giới tính là bắt buộc!"],
    enum: ["Nam", "Nữ"],
  },
  password: {
    type: String,
    required: [true, "Mật khẩu là bắt buộc!"],
    minLength: [8, "Mật khẩu phải chứa ít nhất 8 ký tự"],
    select: false,
  },
  role: {
    type: String,
    required: [true, "Cần có vai trò của người dùng!"],
    enum: ["Patient", "Admin", "Doctor"],
  },
  doctorDepartment: {
    type: String,
  },
  docAvatar: {
    public_id: String,
    url: String,
  },
  appointments: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Appointment",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash mật khẩu trước khi lưu
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// So sánh mật khẩu
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Tạo JWT
userSchema.methods.generateJsonWebToken = function () {
  console.log("📦 Đang tạo token cho:", this.email);
  console.log("🔑 Secret:", process.env.JWT_SECRET_KEY);
  console.log("⏳ Expire:", process.env.JWT_EXPIRES);

  const token = jwt.sign(
    {
      id: this._id.toString(),
      role: this.role,
      email: this.email,
    },
    process.env.JWT_SECRET_KEY,
    { expiresIn: process.env.JWT_EXPIRES || "7d" } // fallback nếu thiếu biến môi trường
  );

  console.log("🔐 Token tạo ra:", token);
  return token;
};

export const User = mongoose.model("User", userSchema);