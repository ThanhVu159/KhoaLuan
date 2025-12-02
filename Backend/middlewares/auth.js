import jwt from "jsonwebtoken";
import ErrorHandler from "./errorMiddleware.js";

// Hàm dùng chung để lấy token từ cookie hoặc header
const getToken = (req, cookieName) => {
  const tokenFromCookie = req.cookies[cookieName];
  const authHeader = req.headers["authorization"];
  const tokenFromHeader = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  return tokenFromCookie || tokenFromHeader || null;
};

// ✅ Xác thực bệnh nhân
export const isPatientAuthenticated = (req, res, next) => {
  const token = getToken(req, "patientToken");
  if (!token) return next(new ErrorHandler("Vui lòng đăng nhập!", 401));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (decoded.role !== "Patient") {
      return next(new ErrorHandler("Không có quyền truy cập!", 403));
    }

    req.user = decoded;
    req.userId = decoded.id || decoded._id;
    next();
  } catch (err) {
    return next(new ErrorHandler("Token không hợp lệ!", 401));
  }
};

// ✅ Xác thực admin
export const isAdminAuthenticated = (req, res, next) => {
  const token = getToken(req, "adminToken");
  if (!token) return next(new ErrorHandler("Vui lòng đăng nhập!", 401));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (decoded.role !== "Admin") {
      return next(new ErrorHandler("Không có quyền truy cập!", 403));
    }

    req.user = decoded;
    req.userId = decoded.id || decoded._id;
    next();
  } catch (err) {
    return next(new ErrorHandler("Token không hợp lệ!", 401));
  }
};

// ✅ Xác thực bác sĩ
export const isDoctorAuthenticated = (req, res, next) => {
  const token = getToken(req, "doctorToken"); // sửa lại cookie đúng
  if (!token) return next(new ErrorHandler("Vui lòng đăng nhập!", 401));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (decoded.role !== "Doctor") {
      return next(new ErrorHandler("Không có quyền truy cập!", 403));
    }

    req.user = decoded;
    req.userId = decoded.id || decoded._id;
    next();
  } catch (err) {
    return next(new ErrorHandler("Token không hợp lệ!", 401));
  }
};