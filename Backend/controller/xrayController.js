import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { Diagnosis } from "../models/diagnosisSchema.js";
import { Appointment } from "../models/appointmentSchema.js";
import cloudinary from "cloudinary";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:5000/predict";
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Created uploads directory:", uploadsDir);
}

const validateXray = (file) => {
  if (!file) throw new ErrorHandler("Vui lòng upload ảnh X-quang!", 400);
  if (!file.tempFilePath || !fs.existsSync(file.tempFilePath)) {
    throw new ErrorHandler("File tạm thời không tồn tại!", 400);
  }
  const allowed = ["image/png", "image/jpeg", "image/jpg"];
  if (!allowed.includes(file.mimetype)) {
    throw new ErrorHandler("Chỉ chấp nhận PNG, JPG, JPEG!", 400);
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new ErrorHandler("File quá lớn (max 10MB)!", 400);
  }
};

const normalizeDetections = (detections = []) =>
  detections.map((det) => {
    const raw = det.bbox || det.box || {};
    let box = {};

    if (Array.isArray(raw)) {
      box = {
        x: Math.round(raw[0]),
        y: Math.round(raw[1]),
        width: Math.round(raw[2]),
        height: Math.round(raw[3]),
      };
      box.x2 = box.x + box.width;
      box.y2 = box.y + box.height;
    } else if (raw.x1 !== undefined) {
      box = {
        x: Math.round(raw.x1),
        y: Math.round(raw.y1),
        x2: Math.round(raw.x2),
        y2: Math.round(raw.y2),
      };
      box.width = box.x2 - box.x;
      box.height = box.y2 - box.y;
    } else if (raw.x !== undefined) {
      box = {
        x: Math.round(raw.x),
        y: Math.round(raw.y),
        width: Math.round(raw.width || raw.w || 0),
        height: Math.round(raw.height || raw.h || 0),
      };
      box.x2 = box.x + box.width;
      box.y2 = box.y + box.height;
    }

    return {
      class: det.class_name || det.class || det.label || "Phát hiện vùng gãy",
      confidence: Number((det.confidence || 0).toFixed(1)),
      box,
    };
  });

const updateAppointment = async (id, prediction, detections, annotatedImage, fallbackUrl) => {
  if (!id) return;

  const fracture =
    /fracture/i.test(prediction.result) ||
    /gãy/i.test(prediction.result) ||
    detections.length > 0;

  await Appointment.findByIdAndUpdate(id, {
    $set: {
      result: {
        fractureDetected: fracture,
        confidence: Number((prediction.confidence || 0).toFixed(2)),
        region: prediction.details || "",
        detections,
        annotatedImage: annotatedImage || fallbackUrl,
      },
    },
  });
};

export const diagnoseXray = catchAsyncErrors(async (req, res, next) => {
  const appointmentId = req.body?.appointmentId || null;
  const patientId = req.userId;
  if (!patientId) {
    return next(new ErrorHandler("Thiếu thông tin đăng nhập!", 400));
  }

  const xrayFile = req.files?.xrayImage;
  try {
    validateXray(xrayFile);
  } catch (err) {
    return next(err);
  }

  try {
    const formData = new FormData();
    console.log("Temp file path:", xrayFile.tempFilePath);
    console.log("File exists:", fs.existsSync(xrayFile.tempFilePath));
    console.log("File size:", xrayFile.size);

    formData.append("file", fs.createReadStream(xrayFile.tempFilePath));

    let prediction;
    try {
      const aiRes = await axios.post(AI_SERVICE_URL, formData, {
        headers: formData.getHeaders(),
        timeout: 120000,
      });
      prediction = aiRes.data;
      console.log("AI service response:", prediction);
    } catch (err) {
      console.error("Lỗi gọi AI service:", err.response?.data || err.message);
      throw new ErrorHandler("Không thể kết nối AI service!", 500);
    }

    const uploaded = await cloudinary.uploader.upload(xrayFile.tempFilePath, {
      folder: "xray_diagnoses",
    });

    let annotatedUrl = null;
    let annotatedPublicId = null;

    if (prediction.annotated_image && prediction.annotated_image.startsWith("data:image")) {
      try {
        const base64Data = prediction.annotated_image.split(",")[1];
        const tmp = path.join(uploadsDir, `tmp_ann_${Date.now()}.png`);

        fs.writeFileSync(tmp, Buffer.from(base64Data, "base64"));

        const annUp = await cloudinary.uploader.upload(tmp, {
          folder: "xray_diagnoses/annotated",
        });

        annotatedUrl = annUp.secure_url;
        annotatedPublicId = annUp.public_id;

        if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      } catch (err) {
        console.error("Annotated image invalid:", err.message);
      }
    }

    const detections = normalizeDetections(prediction.detections);

    const diagnosis = await Diagnosis.create({
      patientId,
      xrayImage: { public_id: uploaded.public_id, url: uploaded.secure_url },
      annotatedImage: annotatedUrl ? { public_id: annotatedPublicId, url: annotatedUrl } : null,
      diagnosis: {
        result: prediction.result || "Không xác định",
        confidence: Number((prediction.confidence || 0).toFixed(1)),
        details: prediction.details || "",
        detections,
        totalDetections: detections.length,
      },
      doctorNote: "",
      status: "pending",
    });

    if (appointmentId) {
      const appointment = await Appointment.findById(appointmentId);
      if (appointment && appointment.status === "Pending") {
        await updateAppointment(
          appointmentId,
          prediction,
          detections,
          annotatedUrl,
          uploaded.secure_url
        );
      } else {
        console.warn("Không cập nhật lịch hẹn: không tồn tại hoặc không ở trạng thái Pending.");
      }
    }

    if (fs.existsSync(xrayFile.tempFilePath)) fs.unlinkSync(xrayFile.tempFilePath);

    res.status(200).json({
      success: true,
      message: "Phân tích X-ray thành công!",
      data: {
        diagnosisId: diagnosis._id,
        imageUrl: uploaded.secure_url,
        annotatedImage: annotatedUrl || uploaded.secure_url,
        result: prediction.result,
        confidence: prediction.confidence,
        detections,
        totalDetections: detections.length,
        timestamp: diagnosis.createdAt,
      },
    });
  } catch (err) {
    if (xrayFile?.tempFilePath && fs.existsSync(xrayFile.tempFilePath))
      fs.unlinkSync(xrayFile.tempFilePath);

    return next(new ErrorHandler(`Lỗi khi phân tích ảnh: ${err.message}`, 500));
  }
});

export const getDiagnosisHistory = catchAsyncErrors(async (req, res) => {
  const history = await Diagnosis.find({ patientId: req.params.patientId })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json({ success: true, count: history.length, history });
});

export const getDiagnosisById = catchAsyncErrors(async (req, res, next) => {
  const item = await Diagnosis.findById(req.params.id);
  if (!item) return next(new ErrorHandler("Không tìm thấy kết quả chẩn đoán!", 404));
  res.json({ success: true, diagnosis: item });
});

export const deleteDiagnosis = catchAsyncErrors(async (req, res, next) => {
  const doc = await Diagnosis.findById(req.params.id);
  if (!doc) return next(new ErrorHandler("Không tìm thấy!", 404));

  const destroy = async (id) => {
    if (id) {
      try {
        await cloudinary.uploader.destroy(id);
      } catch (_) {}
    }
  };

  await destroy(doc.xrayImage?.public_id);
  await destroy(doc.annotatedImage?.public_id);

  await doc.deleteOne();

  res.json({ success: true, message: "Đã xóa kết quả chẩn đoán!" });
});