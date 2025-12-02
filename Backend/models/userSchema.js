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
    minLength: [9, "Số điện thoại phải chứa chính xác 9 chữ số"],
    maxLength: [11, "Số điện thoại phải chứa chính xác 11 chữ số"],
   
  },
  dob: {
    type: Date,
    required: [true, "Ngày sinh là bắt buộc"],
  },
  gender: {
    type: String,
    required: [true, "Giới tính là bắt buộc!"],
    enum: ["Nam", "Nữ",],
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
    enum: ["Patient", "Admin"],
  },
  doctorDepartment: {
    type: String,
  },
  docAvatar: {
    public_id: String,
    url: String,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateJsonWebToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

export const User = mongoose.model("User", userSchema);
