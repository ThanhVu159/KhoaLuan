import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
  {
    fractureDetected: { type: Boolean, default: false },
    confidence: { type: Number, default: 0 },
    details: { type: String, default: "" },
    detections: { type: Array, default: [] },
    totalDetections: { type: Number, default: 0 },
  },
  { _id: false }
);

const diagnosisSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: false,
  },

  patientName: { type: String, default: "" },
  patientEmail: { type: String, default: "" },

  xrayImage: {
    public_id: { type: String, required: true },
    url: { type: String, required: true },
  },

  annotatedImage: {
    public_id: { type: String, default: "" },
    url: { type: String, default: "" },
  },

  diagnosis: {
    result: resultSchema, // ✅ sửa từ String thành Object
  },

  doctorNote: { type: String, default: "" },

  status: {
    type: String,
    enum: ["pending", "reviewed", "completed"],
    default: "pending",
  },

  createdAt: { type: Date, default: Date.now },
  reviewedAt: Date,
});

export const Diagnosis = mongoose.model("Diagnosis", diagnosisSchema);