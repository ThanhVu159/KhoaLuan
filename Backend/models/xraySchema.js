import mongoose from "mongoose";

const xraySchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  imageUrl: { type: String, required: true },           
  result: { type: String, required: true },             
  annotatedImageUrl: { type: String },                 
  createdAt: { type: Date, default: Date.now }
});

export const XrayResult = mongoose.model("XrayResult", xraySchema);
