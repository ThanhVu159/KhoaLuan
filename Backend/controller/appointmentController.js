import { Appointment } from "../models/appointmentSchema.js";
import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";

// ---------------- Tạo lịch hẹn mới ----------------
export const postAppointment = catchAsyncErrors(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    dob,
    gender,
    appointment_date,
    department,
    doctor_firstName,
    doctor_lastName,
    address,
    doctorId,
  } = req.body;

  if (
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !dob ||
    !gender ||
    !appointment_date ||
    !department ||
    !doctor_firstName ||
    !doctor_lastName ||
    !address ||
    !doctorId
  ) {
    return next(new ErrorHandler("Hãy điền đầy đủ thông tin!", 400));
  }

  const appointment = await Appointment.create({
    firstName,
    lastName,
    email,
    phone,
    dob,
    gender,
    appointment_date,
    department,
    doctor: {
      firstName: doctor_firstName,
      lastName: doctor_lastName,
    },
    address,
    doctorId,
    patientId: req.userId,
  });

  // cập nhật hồ sơ bệnh nhân
  await User.findByIdAndUpdate(req.userId, {
    $push: { appointments: appointment._id },
  });

  res.status(200).json({
    success: true,
    message: "Đặt lịch hẹn thành công!",
    appointment,
  });
});

// ---------------- Lấy tất cả lịch hẹn ----------------
export const getAllAppointments = catchAsyncErrors(async (req, res, next) => {
  const appointments = await Appointment.find()
    .populate("patientId", "firstName lastName email phone")
    .populate("doctorId", "firstName lastName doctorDepartment");

  res.status(200).json({ success: true, appointments });
});

// ---------------- Cập nhật trạng thái lịch hẹn ----------------
export const updateAppointmentStatus = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  const appointment = await Appointment.findById(id);
  if (!appointment) {
    return next(new ErrorHandler("Không tìm thấy lịch hẹn!", 404));
  }

  appointment.status = status;
  await appointment.save();

  res.status(200).json({
    success: true,
    message: "Trạng thái lịch hẹn đã được cập nhật!",
    appointment,
  });
});

// ---------------- Huỷ lịch hẹn ----------------
export const deleteAppointment = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const appointment = await Appointment.findById(id);
  if (!appointment) {
    return next(new ErrorHandler("Không tìm thấy lịch hẹn!", 404));
  }

  if (appointment.patientId.toString() !== req.userId.toString()) {
    return next(new ErrorHandler("Bạn không có quyền huỷ lịch hẹn này!", 403));
  }

  await appointment.deleteOne();

  await User.findByIdAndUpdate(req.userId, {
    $pull: { appointments: appointment._id },
  });

  res.status(200).json({
    success: true,
    message: "Đã huỷ lịch hẹn thành công!",
  });
});