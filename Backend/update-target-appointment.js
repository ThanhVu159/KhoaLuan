import mongoose from "mongoose";
import { Appointment } from "./models/appointmentSchema.js";
import dotenv from "dotenv";

dotenv.config({ path: "./config/config.env" });

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("✅ Connected to:", mongoose.connection.db.databaseName);
  
  try {
    // ✅ Target appointment ID
    const targetId = "693e71b2cc44f737d200bdf6";
    
    console.log(`\n🎯 Updating appointment ID: ${targetId}`);
    
    const appointment = await Appointment.findById(targetId);
    
    if (!appointment) {
      console.log("❌ Appointment not found!");
      process.exit(1);
    }
    
    console.log("\n📋 Current appointment:");
    console.log(`   Patient: ${appointment.firstName} ${appointment.lastName}`);
    console.log(`   Department: ${appointment.department}`);
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
    console.log("New result:", JSON.stringify(appointment.result, null, 2));
    
    // Verify
    const verified = await Appointment.findById(targetId);
    console.log("\n🔍 Verification:");
    console.log("Has result?", !!verified.result);
    
    console.log("\n🎉 DONE! Refresh your frontend Profile page.");
    process.exit(0);
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}).catch(err => {
  console.error("❌ Connection error:", err);
  process.exit(1);
});