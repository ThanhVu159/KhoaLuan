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
  if (!id) {
    console.warn("⚠️ updateAppointment called with no ID");
    return false;
  }

  try {
    console.log("🔄 Attempting to update appointment:", id);
    
    const fracture =
      (detections && detections.length > 0) ||
      (/fracture/i.test(prediction.result || "")) ||
      (/gãy/i.test(prediction.result || ""));

    const region = detections && detections.length > 0
      ? detections.map(d => d.class).join(", ")
      : prediction.details || "Chưa xác định";

    const updateData = {
      result: {
        fractureDetected: fracture,
        confidence: Number((prediction.confidence || 0).toFixed(1)),
        region: region,
        totalDetections: detections.length,
        details: prediction.details || "",
        detections,
        analyzedAt: new Date(),
        imageUrl: annotatedImage || fallbackUrl,
      },
      hasResult: true,
    };

    console.log("📝 Update data:", JSON.stringify(updateData, null, 2));

    const updated = await Appointment.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!updated) {
      console.error("❌ Appointment not found:", id);
      return false;
    }

    console.log("✅ Appointment updated successfully!");
    console.log("   - ID:", updated._id);
    console.log("   - hasResult:", updated.hasResult);
    console.log("   - result:", updated.result);

    return true;
  } catch (error) {
    console.error("❌ Error updating appointment:", error);
    console.error("   Error details:", error.message);
    return false;
  }
};

export const diagnoseXray = catchAsyncErrors(async (req, res, next) => {
  const appointmentId = req.body?.appointmentId || null;
  const patientId = req.userId;
  
  // ✅ Log đầu vào
  console.log("\n" + "=".repeat(60));
  console.log("📋 RECEIVED DIAGNOSIS REQUEST");
  console.log("=".repeat(60));
  console.log("  - appointmentId:", appointmentId);
  console.log("  - patientId:", patientId);
  console.log("  - req.body keys:", Object.keys(req.body));
  console.log("  - req.files:", req.files ? Object.keys(req.files) : "none");
  console.log("=".repeat(60) + "\n");
  
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
    formData.append("file", fs.createReadStream(xrayFile.tempFilePath));

    let prediction;
    try {
      console.log("🤖 Calling AI service...");
      const aiRes = await axios.post(AI_SERVICE_URL, formData, {
        headers: formData.getHeaders(),
        timeout: 120000,
      });
      prediction = aiRes.data;
      console.log("✅ AI Service Response received");
      console.log("   Prediction:", JSON.stringify(prediction, null, 2));
    } catch (err) {
      console.error("❌ AI Service Error:", err.message);
      throw new ErrorHandler("Không thể kết nối AI service!", 500);
    }

    console.log("☁️ Uploading to Cloudinary...");
    const uploaded = await cloudinary.uploader.upload(xrayFile.tempFilePath, {
      folder: "xray_diagnoses",
    });
    console.log("✅ Original image uploaded:", uploaded.secure_url);

    let annotatedUrl = null;
    let annotatedPublicId = null;

    if (prediction.annotated_image && prediction.annotated_image.startsWith("data:image")) {
      try {
        console.log("📸 Processing annotated image...");
        const base64Data = prediction.annotated_image.split(",")[1];
        const tmp = path.join(uploadsDir, `tmp_ann_${Date.now()}.png`);
        fs.writeFileSync(tmp, Buffer.from(base64Data, "base64"));

        const annUp = await cloudinary.uploader.upload(tmp, {
          folder: "xray_diagnoses/annotated",
        });

        annotatedUrl = annUp.secure_url;
        annotatedPublicId = annUp.public_id;
        console.log("✅ Annotated image uploaded:", annotatedUrl);

        if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      } catch (err) {
        console.error("❌ Annotated image error:", err.message);
      }
    }

    const detections = normalizeDetections(prediction.detections);
    console.log("🔍 Detections normalized:", detections.length, "items");

    const fracture =
      (detections && detections.length > 0) ||
      (/fracture/i.test(prediction.result || "")) ||
      (/gãy/i.test(prediction.result || ""));

    console.log("💾 Creating diagnosis record...");
    const diagnosis = await Diagnosis.create({
      patientId,
      xrayImage: { public_id: uploaded.public_id, url: uploaded.secure_url },
      annotatedImage: annotatedUrl ? { public_id: annotatedPublicId, url: annotatedUrl } : null,
      diagnosis: {
        result: {
          fractureDetected: fracture,
          confidence: Number((prediction.confidence || 0).toFixed(1)),
          details: prediction.details || "",
          detections,
          totalDetections: detections.length,
        },
      },
      doctorNote: "",
      status: "pending",
    });
    console.log("✅ Diagnosis created:", diagnosis._id);

    let appointmentUpdated = false;
    if (appointmentId) {
      console.log("🔄 Checking appointment:", appointmentId);
      const appointment = await Appointment.findById(appointmentId);
      if (appointment) {
        console.log("✅ Appointment found, updating...");
        appointmentUpdated = await updateAppointment(
          appointmentId,
          prediction,
          detections,
          annotatedUrl,
          uploaded.secure_url
        );
        console.log("📊 Appointment update result:", appointmentUpdated);
      } else {
        console.warn("⚠️ Appointment not found:", appointmentId);
      }
    } else {
      console.warn("⚠️ No appointmentId provided");
    }

    if (fs.existsSync(xrayFile.tempFilePath)) fs.unlinkSync(xrayFile.tempFilePath);

    console.log("\n" + "=".repeat(60));
    console.log("✅ DIAGNOSIS COMPLETED");
    console.log("=".repeat(60));
    console.log("  - Diagnosis ID:", diagnosis._id);
    console.log("  - Appointment Updated:", appointmentUpdated);
    console.log("=".repeat(60) + "\n");

    res.status(200).json({
      success: true,
      message: "Phân tích X-ray thành công!",
      appointmentUpdated,
      data: {
        diagnosisId: diagnosis._id,
        imageUrl: uploaded.secure_url,
        annotatedImage: annotatedUrl || uploaded.secure_url,
        result: diagnosis.diagnosis.result,
        confidence: diagnosis.diagnosis.result.confidence,
        details: diagnosis.diagnosis.result.details,
        detections: diagnosis.diagnosis.result.detections,
        totalDetections: diagnosis.diagnosis.result.totalDetections,
        timestamp: diagnosis.createdAt,
      },
    });
  } catch (err) {
    if (xrayFile?.tempFilePath && fs.existsSync(xrayFile.tempFilePath))
      fs.unlinkSync(xrayFile.tempFilePath);

    console.error("❌ DIAGNOSIS FAILED:", err.message);
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
  if (!item) {
    return next(new ErrorHandler("Không tìm thấy kết quả chẩn đoán!", 404));
  }

  res.json({
    success: true,
    diagnosis: item,
  });
});