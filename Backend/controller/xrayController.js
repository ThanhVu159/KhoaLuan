// ============================================================
// XRay Diagnosis Controller - FIXED VERSION
// ============================================================
// File: controllers/xrayController.js

import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { Diagnosis } from "../models/diagnosisSchema.js";
import { Appointment } from "../models/appointmentSchema.js";
import cloudinary from "cloudinary";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:5000/predict";

// ============================================================
// MAIN: Diagnose X-ray (FIXED - appointmentId optional)
// ============================================================
export const diagnoseXray = catchAsyncErrors(async (req, res, next) => {
  const { patientId, appointmentId } = req.body;

  console.log("📥 Received request:", { patientId, appointmentId, hasFile: !!req.files?.xrayImage });

  // ✅ FIX: Only require patientId, appointmentId is optional
  if (!patientId) {
    return next(new ErrorHandler("Thiếu thông tin bệnh nhân!", 400));
  }

  // ✅ FIX: Only validate appointment if appointmentId is provided
  let appointment = null;
  if (appointmentId) {
    appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      console.warn("⚠️ Appointment not found, continuing without it");
      // Don't block - just log warning
    } else if (appointment.patientId.toString() !== patientId.toString()) {
      return next(new ErrorHandler("Lịch hẹn không khớp với bệnh nhân!", 403));
    } else {
      console.log("✅ Valid appointment found:", appointmentId);
    }
  } else {
    console.log("ℹ️ No appointmentId provided - proceeding without appointment link");
  }

  // Validate X-ray image
  const xrayImage = req.files?.xrayImage;
  if (!xrayImage) {
    return next(new ErrorHandler("Vui lòng upload ảnh X-quang!", 400));
  }

  if (!xrayImage.tempFilePath || !fs.existsSync(xrayImage.tempFilePath)) {
    return next(new ErrorHandler("File tạm thời không tồn tại!", 400));
  }

  const allowedFormats = ["image/png", "image/jpeg", "image/jpg"];
  if (!allowedFormats.includes(xrayImage.mimetype)) {
    return next(new ErrorHandler("Chỉ chấp nhận PNG, JPG, JPEG!", 400));
  }

  const maxSize = 10 * 1024 * 1024;
  if (xrayImage.size > maxSize) {
    return next(new ErrorHandler("File quá lớn (max 10MB)!", 400));
  }

  try {
    // ============================================================
    // Step 1: Call AI Service
    // ============================================================
    console.log("🤖 Calling AI service:", AI_SERVICE_URL);
    const formData = new FormData();
    formData.append("file", fs.createReadStream(xrayImage.tempFilePath));

    let prediction;
    try {
      const aiResponse = await axios.post(AI_SERVICE_URL, formData, {
        headers: formData.getHeaders(),
        timeout: 120000,
      });
      prediction = aiResponse.data;
      console.log("✅ AI prediction:", {
        result: prediction.result,
        confidence: prediction.confidence,
        detections: prediction.total_detections || prediction.detections?.length || 0
      });
    } catch (aiErr) {
      console.error("❌ AI Service error:", aiErr.message);
      if (aiErr.response) {
        console.error("AI Response:", aiErr.response.data);
      }
      return next(new ErrorHandler("Không kết nối được AI Service!", 503));
    }

    // ============================================================
    // Step 2: Upload original image to Cloudinary
    // ============================================================
    console.log("☁️ Uploading to Cloudinary...");
    let cloudinaryResponse;
    try {
      cloudinaryResponse = await cloudinary.uploader.upload(xrayImage.tempFilePath, {
        folder: "xray_diagnoses",
        resource_type: "auto",
      });
      console.log("✅ Cloudinary upload success:", cloudinaryResponse.secure_url);
    } catch (cloudErr) {
      console.error("❌ Cloudinary error:", cloudErr.message);
      return next(new ErrorHandler("Lỗi upload ảnh!", 500));
    }

    // ============================================================
    // Step 3: Upload annotated image (if exists)
    // ============================================================
    let annotatedUrl = "";
    let annotatedPublicId = "";
    
    if (prediction.annotated_image) {
      console.log("📸 Processing annotated image...");
      const tmpFile = `./uploads/tmp_annotated_${Date.now()}.png`;
      
      try {
        fs.writeFileSync(tmpFile, Buffer.from(prediction.annotated_image, "base64"));
        
        const cloudAnnotate = await cloudinary.uploader.upload(tmpFile, {
          folder: "xray_diagnoses/annotated",
          resource_type: "auto",
        });
        
        annotatedUrl = cloudAnnotate.secure_url;
        annotatedPublicId = cloudAnnotate.public_id;
        console.log("✅ Annotated image uploaded:", annotatedUrl);
      } catch (cloudErr) {
        console.error("⚠️ Annotated upload failed:", cloudErr.message);
        // Don't fail the whole request - just skip annotated image
      } finally {
        if (fs.existsSync(tmpFile)) {
          fs.unlinkSync(tmpFile);
        }
      }
    }

    // ============================================================
    // Step 4: Normalize detections
    // ============================================================
    const normalizedDetections = (prediction.detections || []).map((det) => {
      let box = {};
      const bboxData = det.bbox || det.box;
      
      if (bboxData) {
        if (Array.isArray(bboxData)) {
          // Format: [x, y, width, height]
          box.x = Math.round(bboxData[0]);
          box.y = Math.round(bboxData[1]);
          box.width = Math.round(bboxData[2]);
          box.height = Math.round(bboxData[3]);
          box.x2 = box.x + box.width;
          box.y2 = box.y + box.height;
        } else if (typeof bboxData === "object") {
          if ("x1" in bboxData && "y1" in bboxData) {
            // Format: {x1, y1, x2, y2}
            box.x = Math.round(bboxData.x1);
            box.y = Math.round(bboxData.y1);
            box.x2 = Math.round(bboxData.x2);
            box.y2 = Math.round(bboxData.y2);
            box.width = box.x2 - box.x;
            box.height = box.y2 - box.y;
          } else if ("x" in bboxData && "y" in bboxData) {
            // Format: {x, y, width, height} or {x, y, w, h}
            box.x = Math.round(bboxData.x);
            box.y = Math.round(bboxData.y);
            box.width = Math.round(bboxData.width || bboxData.w || 0);
            box.height = Math.round(bboxData.height || bboxData.h || 0);
            box.x2 = box.x + box.width;
            box.y2 = box.y + box.height;
          }
        }
      }

      return {
        class: det.class_name || det.class || det.label || "Phát hiện vùng gãy",
        confidence: parseFloat((det.confidence || 0).toFixed(1)),
        box,
      };
    });

    console.log(`📊 Normalized ${normalizedDetections.length} detections`);

    // ============================================================
    // Step 5: Save diagnosis to database
    // ============================================================
    const diagnosis = await Diagnosis.create({
      patientId,
      xrayImage: {
        public_id: cloudinaryResponse.public_id,
        url: cloudinaryResponse.secure_url,
      },
      annotatedImage: annotatedUrl
        ? { public_id: annotatedPublicId, url: annotatedUrl }
        : null,
      diagnosis: {
        result: prediction.result || "Không xác định",
        confidence: parseFloat((prediction.confidence || 0).toFixed(1)),
        details: prediction.details || `Độ tin cậy: ${(prediction.confidence || 0).toFixed(1)}%`,
        detections: normalizedDetections,
        totalDetections: normalizedDetections.length,
      },
      doctorNote: "",
      status: "pending",
    });

    console.log("✅ Diagnosis saved:", diagnosis._id);

    // ============================================================
    // Step 6: Update appointment (only if appointmentId exists)
    // ============================================================
    if (appointmentId && appointment) {
      try {
        await Appointment.findByIdAndUpdate(
          appointmentId,
          {
            $set: {
              result: {
                fractureDetected:
                  /fracture/i.test(prediction.result) ||
                  /gãy/i.test(prediction.result) ||
                  normalizedDetections.length > 0,
                confidence: parseFloat((prediction.confidence || 0).toFixed(2)),
                region: prediction.details || "",
                detections: normalizedDetections,
                annotatedImage: annotatedUrl || cloudinaryResponse.secure_url,
              },
            },
          },
          { new: true }
        );
        console.log("✅ Appointment updated with results");
      } catch (updateErr) {
        console.error("⚠️ Failed to update appointment:", updateErr.message);
        // Don't fail the whole request
      }
    }

    // ============================================================
    // Step 7: Cleanup temp file
    // ============================================================
    if (fs.existsSync(xrayImage.tempFilePath)) {
      fs.unlinkSync(xrayImage.tempFilePath);
    }

    // ============================================================
    // Step 8: Send response
    // ============================================================
    res.status(200).json({
      success: true,
      message: "Phân tích X-ray thành công!",
      data: {
        diagnosisId: diagnosis._id,
        patientId,
        appointmentId: appointmentId || null,
        imageUrl: cloudinaryResponse.secure_url,
        annotatedImage: annotatedUrl || cloudinaryResponse.secure_url,
        result: prediction.result || "Không xác định",
        confidence: parseFloat((prediction.confidence || 0).toFixed(1)),
        details: prediction.details || `Độ tin cậy: ${(prediction.confidence || 0).toFixed(1)}%`,
        totalDetections: normalizedDetections.length,
        detections: normalizedDetections,
        timestamp: diagnosis.createdAt,
      },
    });

  } catch (error) {
    console.error("💥 Unexpected error:", error);
    console.error("Stack:", error.stack);
    
    // Cleanup temp file on error
    if (xrayImage?.tempFilePath && fs.existsSync(xrayImage.tempFilePath)) {
      fs.unlinkSync(xrayImage.tempFilePath);
    }
    
    return next(new ErrorHandler(`Lỗi khi phân tích ảnh: ${error.message}`, 500));
  }
});

// ============================================================
// Get Diagnosis History
// ============================================================
export const getDiagnosisHistory = catchAsyncErrors(async (req, res, next) => {
  const patientId = req.params.patientId;
  
  if (!patientId) {
    return next(new ErrorHandler("Patient ID is required!", 400));
  }

  const history = await Diagnosis.find({ patientId })
    .sort({ createdAt: -1 })
    .limit(50); // Limit to last 50 diagnoses

  res.status(200).json({ 
    success: true, 
    count: history.length,
    history 
  });
});

// ============================================================
// Get Diagnosis By ID
// ============================================================
export const getDiagnosisById = catchAsyncErrors(async (req, res, next) => {
  const diagnosis = await Diagnosis.findById(req.params.id);
  
  if (!diagnosis) {
    return next(new ErrorHandler("Không tìm thấy kết quả chẩn đoán!", 404));
  }

  res.status(200).json({ 
    success: true, 
    diagnosis 
  });
});

// ============================================================
// Delete Diagnosis
// ============================================================
export const deleteDiagnosis = catchAsyncErrors(async (req, res, next) => {
  const diagnosis = await Diagnosis.findById(req.params.id);
  
  if (!diagnosis) {
    return next(new ErrorHandler("Không tìm thấy!", 404));
  }

  // Delete images from Cloudinary
  if (diagnosis.xrayImage?.public_id) {
    try {
      await cloudinary.uploader.destroy(diagnosis.xrayImage.public_id);
      console.log("✅ Deleted original image from Cloudinary");
    } catch (err) {
      console.error("⚠️ Failed to delete original image:", err.message);
    }
  }

  if (diagnosis.annotatedImage?.public_id) {
    try {
      await cloudinary.uploader.destroy(diagnosis.annotatedImage.public_id);
      console.log("✅ Deleted annotated image from Cloudinary");
    } catch (err) {
      console.error("⚠️ Failed to delete annotated image:", err.message);
    }
  }

  await diagnosis.deleteOne();

  res.status(200).json({ 
    success: true, 
    message: "Đã xóa kết quả chẩn đoán thành công!" 
  });
});