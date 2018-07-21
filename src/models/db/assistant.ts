import * as mongoose from "mongoose";

const assistantSchema = new mongoose.Schema({
  wxid: {
    required: true,
    unique: true,
    type: String
  }, 
  name: {
    required: true,
    type: String
  },
  profilePicture: String,
  qrcode: String,
  isActivate: {
    required: true,
    type: Boolean,
    default: true
  }
});

export const Assistant = mongoose.model("Assistant", assistantSchema);