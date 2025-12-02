import mongoose from "mongoose";
import validator from "validator";

const appointmentSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, "Vui lòng nhập Họ!"],
    minLength: [3, "Họ phải có ít nhất 3 ký tự!"],
  },
  lastName: {
    type: String,
    required: [true, "Vui lòng nhập Tên!"],
    minLength: [2, "Tên phải có ít nhất 2 ký tự!"],
  },
  email: {
    type: String,
    required: [true, "Vui lòng nhập Email!"],
    validate: [validator.isEmail, "Vui lòng nhập Email hợp lệ!"],
  },
  phone: {
    type: String,
    required: [true, "Vui lòng nhập Số điện thoại!"],
    minLength: [9, "Số điện thoại phải đúng 9 chữ số!"],
    maxLength: [9, "Số điện thoại phải đúng 9 chữ số!"],
  },
  dob: {
    type: Date,
    required: [true, "Vui lòng nhập Ngày sinh!"],
  },
  gender: {
    type: String,
    required: [true, "Vui lòng chọn Giới tính!"],
    enum: ["Nam", "Nữ"],
  },
  appointment_date: {
    type: String,
    required: [true, "Vui lòng chọn Ngày hẹn!"],
  },
  department: {
    type: String,
    required: [true, "Vui lòng nhập Khoa!"],
  },
  doctor: {
    firstName: {
      type: String,
      required: [true, "Vui lòng nhập Họ của Bác sĩ!"],
    },
    lastName: {
      type: String,
      required: [true, "Vui lòng nhập Tên của Bác sĩ!"],
    },
  },
  hasVisited: {
    type: Boolean,
    default: false,
  },
  address: {
    type: String,
    required: [true, "Vui lòng nhập Địa chỉ!"],
  },
  doctorId: {
    type: mongoose.Schema.ObjectId,
    required: [true, "ID Bác sĩ không hợp lệ!"],
  },
  patientId: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Vui lòng nhập ID Bệnh nhân!"],
  },
  status: {
    type: String,
    enum: ["Pending", "Accepted", "Rejected"],
    default: "Pending",
  },


  result: {
    fractureDetected: { type: Boolean, default: false },
    confidence: { type: Number, default: 0 },
    region: { type: String, default: "" },
    detections: { type: Array, default: [] },
    annotatedImage: { type: String, default: "" },
  },
});

export const Appointment = mongoose.model("Appointment", appointmentSchema);