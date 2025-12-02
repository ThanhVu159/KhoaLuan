import mongoose from "mongoose";
import validator from "validator";

const messageSchema = new mongoose.Schema({
    firstName:{
        type: String,
        required: true,
        minLength: [3, "Cần chứa ít nhất 3 ký tự"]
    },
    lastName:{
        type: String,
        required: true,
        minLength: [2, "Cần chứa ít nhất 2 ký tự"]
    },
    email:{
        type: String,
        required: true,
        validate: [validator.isEmail, "Hãy điền Email hợp lệ"] 
    },
    phone:{
        type: String,
        required: true,
        minLength: [9, "Cần chứa ít nhất 9 số"],
        maxLength: [9, "Cần chứa tối đa 9 số"], 
    },
    message:{
        type: String,
        required: true,
        minLength: [3, "Cần chứa ít nhất 3 ký tự"]
    },
});

export const Message = mongoose.model("Message", messageSchema);