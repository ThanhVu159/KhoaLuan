import { User } from "../models/userSchema.js";
import { Appointment } from "../models/appointmentSchema.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import cloudinary from "cloudinary";

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
  // Lấy thông tin user
  const user = await User.findById(req.userId).select("-password");

  if (!user) {
    return next(new ErrorHandler("Không tìm thấy hồ sơ bệnh nhân!", 404));
  }

  // Lấy tất cả appointments của user này từ Appointment model
  const appointments = await Appointment.find({ patientId: req.userId })
    .populate({
      path: "doctorId",
      select: "firstName lastName doctorDepartment email phone",
    })
    .sort({ appointment_date: -1 }); // Sắp xếp mới nhất trước

  console.log(`Found ${appointments.length} appointments for user ${req.userId}`);
  
  // Log để debug
  if (appointments.length > 0) {
    console.log("Sample appointment result field:", appointments[0].result);
  }

  res.status(200).json({
    success: true,
    user: {
      ...user.toObject(),
      appointments, // ✅ Gắn appointments vào user object
    },
  });
});

// ---------------- Đăng xuất bệnh nhân ----------------
export const logoutPatient = catchAsyncErrors(async (req, res, next) => {
  res.clearCookie("patientToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  
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
  res.clearCookie("adminToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  
  res.status(200).json({
    success: true,
    message: "Đăng xuất thành công!",
  });
});

export const addNewAdmin = catchAsyncErrors(async (req, res, next) => {
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

// ---------------- Thêm bác sĩ mới (CÓ UPLOAD ẢNH) ----------------
export const addNewDoctor = catchAsyncErrors(async (req, res, next) => {
  const { firstName, lastName, email, phone, dob, gender, password, doctorDepartment } = req.body;

  console.log(" Received data:", { firstName, lastName, email, phone, dob, gender, doctorDepartment });
  console.log(" Files:", req.files);

  // Validate đầy đủ thông tin
  if (!firstName || !lastName || !email || !phone || !dob || !gender || !password || !doctorDepartment) {
    return next(new ErrorHandler("Vui lòng nhập đầy đủ thông tin!", 400));
  }

  // Kiểm tra email đã tồn tại
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorHandler("Email đã tồn tại!", 400));
  }

  // Xử lý upload ảnh lên Cloudinary
  let docAvatarData = {};
  if (req.files && req.files.docAvatar) {
    const docAvatar = req.files.docAvatar;
    
    console.log(" Uploading to Cloudinary...");
    
    // Upload lên Cloudinary
    const cloudinaryResponse = await cloudinary.v2.uploader.upload(
      docAvatar.tempFilePath,
      {
        folder: "doctors",
        width: 300,
        crop: "scale"
      }
    );

    if (!cloudinaryResponse || cloudinaryResponse.error) {
      console.error(" Cloudinary Error:", cloudinaryResponse.error || "Unknown Cloudinary error");
      return next(new ErrorHandler("Lỗi khi upload ảnh!", 500));
    }

    console.log(" Cloudinary upload success:", cloudinaryResponse.secure_url);

    docAvatarData = {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    };
  }

  // Tạo bác sĩ mới
  const doctor = await User.create({
    firstName,
    lastName,
    email,
    phone,
    dob,
    gender,
    password,
    role: "Doctor",
    doctorDepartment,
    docAvatar: docAvatarData.url ? docAvatarData : undefined,
  });

  console.log("✅ Doctor created successfully:", doctor._id);

  res.status(201).json({
    success: true,
    message: "Thêm bác sĩ thành công!",
    doctor,
  });
});

// ---------------- Xóa bác sĩ ----------------
export const deleteDoctor = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const doctor = await User.findById(id);

  if (!doctor) {
    return next(new ErrorHandler("Không tìm thấy bác sĩ!", 404));
  }

  if (doctor.docAvatar && doctor.docAvatar.public_id) {
    await cloudinary.v2.uploader.destroy(doctor.docAvatar.public_id);
  }

  await doctor.deleteOne();

  res.status(200).json({
    success: true,
    message: "Xoá bác sĩ thành công!",
  });
});