import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { generateToken } from "../utils/jwtToken.js";
import cloudinary from "cloudinary";

// Bộ chuyển đổi tên chuyên khoa sang tiếng Việt
const departmentMap = {
  Pediatrics: "Nhi",
  Cardiology: "Tim mạch",
  Neurology: "Thần kinh",
  Oncology: "Ung bướu",
  Dermatology: "Da liễu",
  Orthopedics: "Chỉnh hình",
  Gastroenterology: "Tiêu hóa",
  ENT: "Tai mũi họng",
  Ophthalmology: "Mắt",
  Psychiatry: "Tâm thần",
};

// ==========================
//  Đăng ký bệnh nhân
// ==========================
export const patientRegister = catchAsyncErrors(async (req, res, next) => {
  const { firstName, lastName, email, phone, dob, gender, password } = req.body;

  if (!firstName || !lastName || !email || !phone || !dob || !gender || !password)
    return next(new ErrorHandler("Hãy điền đủ thông tin", 400));

  if (await User.findOne({ email }))
    return next(new ErrorHandler("Email đã tồn tại!", 400));

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

  generateToken(user, "Người dùng đã đăng ký", 200, res);
});

// ==========================
//  Đăng nhập
// ==========================
export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role)
    return next(new ErrorHandler("Hãy điền đầy đủ thông tin", 400));

  const user = await User.findOne({ email }).select("+password");
  if (!user) return next(new ErrorHandler("Email hoặc mật khẩu không hợp lệ!", 400));

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return next(new ErrorHandler("Email hoặc mật khẩu không hợp lệ!", 400));

  if (role !== user.role)
    return next(new ErrorHandler("Không đúng vai trò đăng nhập!", 400));

  generateToken(user, "Đăng nhập thành công!", 200, res);
});

// ==========================
//  Thêm quản trị viên mới
// ==========================
export const addNewAdmin = catchAsyncErrors(async (req, res, next) => {
  const { firstName, lastName, email, phone, dob, gender, password } = req.body;

  if (!firstName || !lastName || !email || !phone || !dob || !gender || !password)
    return next(new ErrorHandler("Hãy điền đầy đủ thông tin", 400));

  if (await User.findOne({ email }))
    return next(new ErrorHandler("Email đã được sử dụng!", 400));

  await User.create({
    firstName,
    lastName,
    email,
    phone,
    dob,
    gender,
    password,
    role: "Admin",
  });

  res.status(200).json({ success: true, message: "Đã đăng ký quản trị viên mới" });
});

// ==========================
//  Lấy danh sách bác sĩ
// ==========================
export const getAllDoctors = catchAsyncErrors(async (req, res, next) => {
  const doctors = await User.find({ role: "Doctor" });

  const doctorsWithVNDepartment = doctors.map((doc) => ({
    ...doc._doc,
    doctorDepartmentVN: departmentMap[doc.doctorDepartment] || doc.doctorDepartment,
  }));

  res.status(200).json({ success: true, doctors: doctorsWithVNDepartment });
});

// ==========================
//  Thêm bác sĩ mới
// ==========================
export const addNewDoctor = catchAsyncErrors(async (req, res, next) => {
  if (!req.files || !req.files.docAvatar)
    return next(new ErrorHandler("Yêu cầu ảnh đại diện của bác sĩ!", 400));

  const { docAvatar } = req.files;

  const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedFormats.includes(docAvatar.mimetype))
    return next(new ErrorHandler("Định dạng tệp không được hỗ trợ!", 400));

  const {
    firstName,
    lastName,
    email,
    phone,
    dob,
    gender,
    password,
    doctorDepartment,
  } = req.body;

  if (
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !dob ||
    !gender ||
    !password ||
    !doctorDepartment
  )
    return next(new ErrorHandler("Hãy điền đầy đủ thông tin!", 400));

  if (await User.findOne({ email }))
    return next(new ErrorHandler("Email đã được sử dụng!", 400));

  const cloudinaryResponse = await cloudinary.uploader.upload(docAvatar.tempFilePath);

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
    docAvatar: {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    },
  });

  res.status(200).json({
    success: true,
    message: "Bác sĩ mới đã được đăng ký",
    doctor: {
      ...doctor._doc,
      doctorDepartmentVN:
        departmentMap[doctor.doctorDepartment] || doctor.doctorDepartment,
    },
  });
});

// ==========================
//  Xóa bác sĩ
// ==========================
export const deleteDoctor = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const doctor = await User.findById(id);
  if (!doctor) return next(new ErrorHandler("Không tìm thấy bác sĩ!", 404));
  if (doctor.role !== "Doctor")
    return next(new ErrorHandler("ID này không phải bác sĩ!", 400));

  await doctor.deleteOne();

  res.status(200).json({ success: true, message: "Đã xoá bác sĩ!" });
});

// ==========================
//  Xóa bệnh nhân
// ==========================
export const deletePatient = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const patient = await User.findById(id);
  if (!patient) return next(new ErrorHandler("Không tìm thấy bệnh nhân!", 404));
  if (patient.role !== "Patient")
    return next(new ErrorHandler("ID này không phải bệnh nhân!", 400));

  await patient.deleteOne();

  res.status(200).json({ success: true, message: "Đã xoá bệnh nhân!" });
});

// ==========================
//  Lấy thông tin người dùng
// ==========================
export const getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = { ...req.user._doc };
  delete user.password;

  res.status(200).json({ success: true, user });
});

// ==========================
//  Đăng xuất
// ==========================
export const logoutAdmin = catchAsyncErrors(async (req, res) => {
  res
    .status(200)
    .cookie("adminToken", "", { httpOnly: true, expires: new Date(0) })
    .json({ success: true, message: "Quản trị viên đăng xuất thành công" });
});

export const logoutPatient = catchAsyncErrors(async (req, res) => {
  res
    .status(200)
    .cookie("patientToken", "", { httpOnly: true, expires: new Date(0) })
    .json({ success: true, message: "Bệnh nhân đăng xuất thành công" });
});

// ==========================
//  Lấy hồ sơ bệnh nhân (kèm lịch hẹn)
// ==========================
export const getPatientProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.userId).populate("appointments");

  if (!user) return next(new ErrorHandler("Không tìm thấy người dùng!", 404));

  res.status(200).json({ success: true, user });
});