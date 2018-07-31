import { Document } from "mongoose";
import { getLogger } from "log4js";
import { VM } from "models/db/vm";
import { Assistant } from "models/db/assistant";
const logger = getLogger("vmCtrl");

export interface VMUpdate {
  psList ?: string[];
  isNetConnected ?: boolean;
  isAdbConnected ?: boolean;
  isWechatForeground ?: boolean;
}

export const updateVM = (ip: string, updateObj: VMUpdate) => {
  return VM.findOneAndUpdate({
    ip: ip
  }, Object.assign({
    updateTime: Date.now()
  }, updateObj), {
    upsert: false
  }).exec().then(
    (obj: Document) => obj && obj.toObject(),
    (err) => {
      logger.error("Update VM Status err: " + err);
      return Promise.reject(false);
    } 
  );
};

export const getAllVMs = (): Promise<any> => {
  return VM.find({}, {
    name: true,
    ip: true,
    wxid: true
  }).exec().then(
    (vms: Document[]) => vms,
    (reason: any) => {
      logger.error("Find VMs error: ", reason);
      return Promise.reject(reason);
    }
  );
};

export const getVMInfo = (ip: string): Promise<any> => {
  return VM.findOne({
    ip: ip
  }).exec().then(
    (vmInfo: Document) => {
      if(!vmInfo)
        return vmInfo;
      return Assistant.findOne({
        wxid: vmInfo.get("wxid")
      }).exec().then(
        (assistantInfo: Document) => {
          if(!assistantInfo)
            return vmInfo;
          return Object.assign(vmInfo.toObject(), {
            nickname: assistantInfo.get("name")
          });
        } 
      );
    }
  ).catch(
    (reason: any) => {
      logger.error("Find VMInfo error: ", reason);
      return Promise.reject(reason);
    }
  );
};