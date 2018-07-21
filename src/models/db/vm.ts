import * as mongoose from "mongoose";

const vmSchema = new mongoose.Schema({
  name: {
    required: true,
    unique: true,
    type: String
  }, 
  ip: {
    required: true,
    type: String
  },
  wxid: {
    required: true,
    unique: true,
    type: String
  },
  psList: {
    required: true,
    type: Array,
    default: []
  },
  isNetConnected: {
    required: true,
    default: false,
    type: Boolean
  },
  isAdbConnected: {
    required: true,
    default: false,
    type: Boolean
  },
  isWechatForeground: {
    required: true,
    default: false,
    type: Boolean
  },
  updateTime: {
    required: true,
    default: Date.now,
    type: Date
  }
});

export const VM = mongoose.model("VM", vmSchema);