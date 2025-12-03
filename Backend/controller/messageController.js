import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { Message } from "../models/messageSchema.js";

// ------------------------------
//  Bệnh nhân gửi tin nhắn
// ------------------------------
export const sendMessage = catchAsyncErrors(async (req, res, next) => {
  const { firstName, lastName, email, phone, message } = req.body;

  // Validate
  if (!firstName || !lastName || !email || !phone || !message) {
    return next(new ErrorHandler("Hãy điền đầy đủ thông tin!", 400));
  }

  // Tạo tin nhắn
  const newMessage = await Message.create({
    firstName,
    lastName,
    email,
    phone,
    message, // ✅ đúng tên field trong schema
  });

  res.status(200).json({
    success: true,
    message: "Tin nhắn gửi thành công!",
    data: newMessage,
  });
});

// ------------------------------
//  Lấy tất cả tin nhắn
// ------------------------------
export const getAllMessages = catchAsyncErrors(async (req, res, next) => {
  const messages = await Message.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    messages,
  });
});

// ------------------------------
//  Xoá tin nhắn
// ------------------------------
export const deleteMessage = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const msg = await Message.findById(id);

  if (!msg) {
    return next(new ErrorHandler("Không tìm thấy tin nhắn!", 404));
  }

  await msg.deleteOne();

  res.status(200).json({
    success: true,
    message: "Đã xoá tin nhắn!",
  });
});