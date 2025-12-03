import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";

// ---------------- Đăng ký bệnh nhân ----------------
export const patientRegister = catchAsyncErrors(async (req, res, next) => {
  const { firstName, lastName, email, phone, dob, gender, password } = req.body;

  if (!firstName || !lastName || !email || !phone || !dob || !gender || !password) {
    return next(new ErrorHandler("Vui lòng nhập đầy đủ thông tin!", 400));
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorHandler("Email đã tồn tại!", 400));
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    phone,
    dob,
    gender,
    password,
    role: "Patient",
  });

  const token = user.generateJsonWebToken();
  res.cookie("patientToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(201).json({
    success: true,
    message: "Đăng ký bệnh nhân thành công!",
    user,
  });
});

// ---------------- Đăng nhập ----------------
export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Vui lòng nhập Email và Mật khẩu!", 400));
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Không tìm thấy người dùng!", 404));
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new ErrorHandler("Mật khẩu không đúng!", 401));
  }

  const token = user.generateJsonWebToken();
  const cookieName = user.role === "Admin" ? "adminToken" : "patientToken";

  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json({
    success: true,
    message: "Đăng nhập thành công!",
    user,
  });
});

// ---------------- Lấy thông tin bệnh nhân (cơ bản) ----------------
export const getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.userId).select("-password");
  if (!user) {
    return next(new ErrorHandler("Không tìm thấy bệnh nhân!", 404));
  }

  res.status(200).json({ success: true, user });
});

// ---------------- Lấy hồ sơ bệnh nhân kèm lịch hẹn ----------------
export const getUserProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.userId)
    .select("-password")
    .populate({
      path: "appointments",
      populate: [
        { path: "doctorId", select: "firstName lastName doctorDepartment" },
        { path: "patientId", select: "firstName lastName email phone" },
      ],
    });

  if (!user) {
    return next(new ErrorHandler("Không tìm thấy hồ sơ bệnh nhân!", 404));
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// ---------------- Đăng xuất bệnh nhân ----------------
export const logoutPatient = catchAsyncErrors(async (req, res, next) => {
  res.clearCookie("patientToken");
  res.status(200).json({
    success: true,
    message: "Đăng xuất thành công!",
  });
});

// ---------------- Admin ----------------
export const getAdminDetails = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.userId).select("-password");
  if (!user) {
    return next(new ErrorHandler("Không tìm thấy Admin!", 404));
  }

  res.status(200).json({ success: true, user });
});

export const logoutAdmin = catchAsyncErrors(async (req, res, next) => {
  res.clearCookie("adminToken");
  res.status(200).json({
    success: true,
    message: "Đăng xuất Admin thành công!",
  });
});

export const addNewAdmin = catchAsyncErrors(async (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return next(new ErrorHandler("Vui lòng nhập đầy đủ thông tin!", 400));
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorHandler("Email đã tồn tại!", 400));
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: "Admin",
  });

  res.status(201).json({
    success: true,
    message: "Thêm Admin thành công!",
    user,
  });
});

// ---------------- Doctors ----------------
export const getAllDoctors = catchAsyncErrors(async (req, res, next) => {
  const doctors = await User.find({ role: "Doctor" }).select("-password");
  res.status(200).json({ success: true, doctors });
});

export const addNewDoctor = catchAsyncErrors(async (req, res, next) => {
  const { firstName, lastName, email, password, doctorDepartment } = req.body;

  if (!firstName || !lastName || !email || !password || !doctorDepartment) {
    return next(new ErrorHandler("Vui lòng nhập đầy đủ thông tin!", 400));
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorHandler("Email đã tồn tại!", 400));
  }

  const doctor = await User.create({
    firstName,
    lastName,
    email,
    password,
    role: "Doctor",
    doctorDepartment,
  });

  res.status(201).json({
    success: true,
    message: "Thêm bác sĩ thành công!",
    doctor,
  });
});

export const deleteDoctor = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const doctor = await User.findById(id);

  if (!doctor) {
    return next(new ErrorHandler("Không tìm thấy bác sĩ!", 404));
  }

  await doctor.deleteOne();

  res.status(200).json({
    success: true,
    message: "Xoá bác sĩ thành công!",
  });
});