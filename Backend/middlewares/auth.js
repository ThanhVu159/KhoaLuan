import jwt from "jsonwebtoken";
import ErrorHandler from "./errorMiddleware.js";

export const isPatientAuthenticated = (req, res, next) => {
  const token = req.cookies.patientToken;
  if (!token) return next(new ErrorHandler("Vui lòng đăng nhập!", 401));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (decoded.role !== "Patient") {
      return next(new ErrorHandler("Không có quyền truy cập!", 403));
    }
    req.user = decoded;
    next();
  } catch (err) {
    return next(new ErrorHandler("Token không hợp lệ!", 401));
  }
};

export const isAdminAuthenticated = (req, res, next) => {
  const token = req.cookies.adminToken;
  if (!token) return next(new ErrorHandler("Vui lòng đăng nhập!", 401));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (decoded.role !== "Admin") {
      return next(new ErrorHandler("Không có quyền truy cập!", 403));
    }
    req.user = decoded;
    next();
  } catch (err) {
    return next(new ErrorHandler("Token không hợp lệ!", 401));
  }
};