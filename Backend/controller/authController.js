import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import jwt from "jsonwebtoken";

export const loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password, role } = req.body;

  // Kiểm tra input
  if (!email || !password || !role) {
    return next(new ErrorHandler("Vui lòng nhập đầy đủ thông tin!", 400));
  }

  // Tìm user theo email và lấy cả password
  const user = await User.findOne({ email }).select("+password");
  if (!user) return next(new ErrorHandler("Tài khoản không tồn tại!", 404));

  // So sánh mật khẩu
  const isMatch = await user.comparePassword(password);
  if (!isMatch) return next(new ErrorHandler("Mật khẩu không đúng!", 401));

  // Kiểm tra role
  if (user.role !== role) {
    return next(new ErrorHandler("Bạn không có quyền truy cập!", 403));
  }

  // Tạo JWT token
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES,
  });

  // Đặt tên cookie theo role
  const cookieName = role === "Admin" ? "adminToken" : "patientToken";

  // Gửi cookie + response
  res
    .status(200)
    .cookie(cookieName, token, {
      httpOnly: true,
      secure: false, // ⚠️ nếu deploy HTTPS thì đổi thành true
      sameSite: "lax",
      expires: new Date(Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    })
    .json({
      success: true,
      message: "Đăng nhập thành công!",
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
});