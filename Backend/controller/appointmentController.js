import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { Appointment } from "../models/appointmentSchema.js";
import { User } from "../models/userSchema.js";

// ------------------------------
//  Đặt lịch hẹn mới
// ------------------------------
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
    hasVisited,
    address,
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
    !address
  ) {
    return next(new ErrorHandler("Hãy điền toàn bộ!", 400));
  }

  const doctorList = await User.find({
    firstName: doctor_firstName,
    lastName: doctor_lastName,
    role: "Doctor",
    doctorDepartment: department,
  });

  if (doctorList.length === 0) {
    return next(new ErrorHandler("Không tìm thấy Bác Sĩ", 404));
  }

  if (doctorList.length > 1) {
    return next(
      new ErrorHandler(
        "Hiện có trùng lịch với bác sĩ. Xin vui lòng liên hệ qua Email hoặc SĐT để được hỗ trợ",
        400
      )
    );
  }

  const doctorId = doctorList[0]._id;
  const patientId = req.userId;
  const dobDate = new Date(dob);

  const appointment = await Appointment.create({
    firstName,
    lastName,
    email,
    phone,
    dob: dobDate,
    gender,
    appointment_date,
    department,
    doctor: {
      firstName: doctor_firstName,
      lastName: doctor_lastName,
    },
    hasVisited,
    address,
    doctorId,
    patientId,
    status: "Pending", // 👈 mặc định trạng thái
  });

  await User.findByIdAndUpdate(
    patientId,
    { $push: { appointments: appointment._id } },
    { new: true }
  );

  res.status(200).json({
    success: true,
    appointment,
    message: "Đặt lịch thành công và hồ sơ đã cập nhật!",
  });
});

// ------------------------------
//  Lấy tất cả lịch hẹn
// ------------------------------
export const getAllAppointments = catchAsyncErrors(async (req, res, next) => {
  const appointments = await Appointment.find();
  res.status(200).json({ success: true, appointments });
});

// ------------------------------
//  Cập nhật trạng thái lịch hẹn
// ------------------------------
export const updateAppointmentStatus = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  let appointment = await Appointment.findById(id);
  if (!appointment) {
    return next(new ErrorHandler("Không tìm thấy lịch hẹn!", 404));
  }

  appointment = await Appointment.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    message: "Đã cập nhật trạng thái lịch hẹn!",
    appointment,
  });
});

export const deleteAppointment = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const appointment = await Appointment.findById(id);
  if (!appointment) {
    return next(new ErrorHandler("Không tìm thấy lịch hẹn!", 404));
  }

  console.log("req.userId:", req.userId);
  console.log("appointment.patientId:", appointment.patientId.toString());
  console.log("appointment.status:", appointment.status);

  if (!req.userId || appointment.patientId.toString() !== req.userId) {
    return next(new ErrorHandler("Bạn không có quyền huỷ lịch này!", 403));
  }

  if (appointment.status !== "Pending") {
    return next(new ErrorHandler("Chỉ được huỷ lịch đang chờ!", 400));
  }

  await appointment.deleteOne();

  await User.findByIdAndUpdate(appointment.patientId, {
    $pull: { appointments: appointment._id },
  });

  res.status(200).json({
    success: true,
    message: "Đã huỷ lịch hẹn!",
  });
});