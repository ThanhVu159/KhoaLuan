async function updateAppointmentResult() {
  try {
    // ✅ Update ĐÚNG appointment ID
    const targetId = "693e71b2cc44f737d200bdf6";
    
    console.log(`\n🎯 Targeting appointment ID: ${targetId}`);
    
    const appointment = await Appointment.findById(targetId);
    
    if (!appointment) {
      console.log("❌ Appointment not found!");
      process.exit(1);
    }
    
    console.log("\n📋 Found appointment:");
    console.log(`   Patient: ${appointment.firstName} ${appointment.lastName}`);
    console.log(`   Current result:`, appointment.result);
    
    // Update result
    appointment.result = {
      fractureDetected: true,
      confidence: 88.7,
      region: "Xương quay (Radius) - Cổ tay phải",
      detections: [
        { 
          class: "Fracture",
          confidence: 88.7,
          box: { x: 150, y: 200, width: 80, height: 100 }
        }
      ],
      annotatedImage: ""
    };
    
    await appointment.save();
    
    console.log("\n✅ Update successful!");
    console.log("New result:", appointment.result);
    console.log("\n🎉 DONE! Now refresh your frontend.");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error);
    process.exit(1);
  }
}import mongoose from "mongoose";
import { Appointment } from "./models/appointmentSchema.js";
import dotenv from "dotenv";

dotenv.config({ path: "./config/config.env" });

// Kết nối MongoDB
const MONGO_URI = process.env.MONGO_URI.replace(/\/\?/, '/AI-Medical?');
console.log("🔗 Connecting to:", MONGO_URI);

mongoose.connect(MONGO_URI).then(() => {
  console.log("✅ Connected to MongoDB");
  console.log("📊 Database name:", mongoose.connection.db.databaseName);
  
  checkDatabase();
}).catch((err) => {
  console.error("❌ MongoDB connection error:", err);
  process.exit(1);
});

async function checkDatabase() {
  try {
    // ✅ Kiểm tra database và collections
    const db = mongoose.connection.db;
    console.log("\n📊 Current Database:", db.databaseName);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log("\n📦 Available Collections:");
    collections.forEach((col) => {
      console.log(`   - ${col.name}`);
    });

    // ✅ Kiểm tra collection appointments
    const appointmentsExists = collections.some(col => 
      col.name === 'appointments' || col.name === 'Appointments'
    );

    if (!appointmentsExists) {
      console.log("\n❌ 'appointments' collection NOT FOUND!");
      console.log("💡 Possible reasons:");
      console.log("   1. No appointments have been created yet");
      console.log("   2. Collection name is different");
      console.log("   3. Wrong database connection");
      process.exit(1);
    }

    // ✅ Đếm documents trong collection
    const count = await Appointment.countDocuments();
    console.log(`\n📊 Total appointments in collection: ${count}`);

    if (count === 0) {
      console.log("\n❌ No appointments found in database!");
      console.log("💡 Solution: Create an appointment from your frontend first.");
      process.exit(1);
    }

    // ✅ Nếu có appointments, list ra
    updateAppointmentResult();
    
  } catch (error) {
    console.error("❌ Error checking database:", error);
    process.exit(1);
  }
}