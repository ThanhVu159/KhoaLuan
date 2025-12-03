import jwt from "jsonwebtoken";
import { User } from "../models/userSchema.js";
import { catchAsyncErrors } from "./catchAsyncErrors.js";
import ErrorHandler from "./errorMiddleware.js";

// Middleware chung cho tất cả user
export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  let token;

  if (req.cookies.adminToken) {
    token = req.cookies.adminToken;
  } else if (req.cookies.patientToken) {
    token = req.cookies.patientToken;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new ErrorHandler("User is not authenticated!", 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (err) {
    return next(new ErrorHandler("Invalid or expired token!", 401));
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new ErrorHandler("User not found!", 404));
  }

  req.user = user;       // ✅ để controller /me dùng được
  req.userId = user._id; // ✅ để các controller khác dùng nếu cần
  next();
});

// Middleware chỉ cho Admin
export const isAdminAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const token = req.cookies.adminToken;
  if (!token) {
    return next(new ErrorHandler("Dashboard User is not authenticated!", 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (err) {
    return next(new ErrorHandler("Invalid or expired token!", 401));
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new ErrorHandler("User not found!", 404));
  }

  if (user.role !== "Admin") {
    return next(new ErrorHandler(`${user.role} not authorized for this resource!`, 403));
  }

  req.user = user;
  req.userId = user._id; // ✅ thêm để đồng bộ
  next();
});

// Middleware chỉ cho Patient
export const isPatientAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const token = req.cookies.patientToken;
  if (!token) {
    return next(new ErrorHandler("User is not authenticated!", 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (err) {
    return next(new ErrorHandler("Invalid or expired token!", 401));
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new ErrorHandler("User not found!", 404));
  }

  if (user.role !== "Patient") {
    return next(new ErrorHandler(`${user.role} not authorized for this resource!`, 403));
  }

  req.user = user;
  req.userId = user._id; // ✅ thêm để dùng trong các controller
  next();
});

// Middleware kiểm tra quyền theo role
export const isAuthorized = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `${req.user ? req.user.role : "Unknown"} not allowed to access this resource!`,
          403
        )
      );
    }
    next();
  };
};