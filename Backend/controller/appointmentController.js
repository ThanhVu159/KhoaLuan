

import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { Appointment } from "../models/appointmentSchema.js";
import { User } from "../models/userSchema.js";

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

  // Validate missing fields
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

  // Check doctor exists
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
  const patientId = req.user._id;

  // Create appointment
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
    hasVisited,
    address,
    doctorId,
    patientId,
  });

  res.status(200).json({
    success: true,
    appointment,
    message: "Đặt lịch thành công!!",
  });
});

// ------------------------------
//  Get All Appointments
// ------------------------------
export const getAllAppointments = catchAsyncErrors(async (req, res, next) => {
  const appointments = await Appointment.find();

  res.status(200).json({
    success: true,
    appointments,
  });
});

// ------------------------------
//  Update Appointment Status
// ------------------------------
export const updateAppointmentStatus = catchAsyncErrors(
  async (req, res, next) => {
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
  }
);

// ------------------------------
//  Delete Appointment
// ------------------------------
export const deleteAppointment = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const appointment = await Appointment.findById(id);

  if (!appointment) {
    return next(new ErrorHandler("Không tìm thấy lịch hẹn!", 404));
  }

  await appointment.deleteOne();

  res.status(200).json({
    success: true,
    message: "Đã xoá lịch hẹn!",
  });
});
