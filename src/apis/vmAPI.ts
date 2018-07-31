import { Response, Request } from "express";
import * as Joi from "joi";
import { getLogger } from "log4js";
import * as vmCtrl from "controllers/vmCtrl";
import * as adbUtils from "utils/adbUtils";
import * as netUtils from "utils/netUtils";
import { retry } from "utils/retry";
const logger = getLogger("vmAPI");

export const CheckNetConnectedSchema = {
  "params": {
    ip: Joi.string().regex(/^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}:\d+$/).required()
  }
};

export const checkNetConnected = (req: Request, res: Response) => {
  const ip = req.params.ip;
  netUtils.checkIP(ip).then(
    (isConnected) => {
      vmCtrl.updateVM(ip, {
        isNetConnected: isConnected
      }).then(
        () => {
          return res.status(200).json({
            ip: ip,
            isNetConnected: isConnected
          });
        });
    }
  ).catch(
    (err) => res.status(500).send(err)
  );
};

export const CheckAdbConnectedSchema = {
  "params": {
    ip: Joi.string().regex(/^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}:\d+$/).required()
  }
};

export const checkAdbConnected = (req: Request, res: Response) => {
  const ip = req.params.ip;
  adbUtils.isDeviceConnected(ip).then(
    (isConnected) => {
      vmCtrl.updateVM(ip, {
        isAdbConnected: isConnected
      }).then(
        () => {
          return res.status(200).json({
            ip: ip,
            isAdbConnected: isConnected
          });
        }
      );
    }
  ).catch(
    (err) => res.status(500).send(err)
  );
};

export const GetWechatProcessesSchema = {
  "params": {
    ip: Joi.string().regex(/^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}:\d+$/).required()
  }
};

export const getWechatProcesses = (req: Request, res: Response) => {
  const ip = req.params.ip;
  adbUtils.ensureDeviceConnect(ip).then(
    () => {
      return adbUtils.getWechatProcess(ip).then(
        (processes) => {
          const response = {
            ip: ip,
            psList: processes
          };
          return vmCtrl.updateVM(ip, {
            isAdbConnected: true,
            psList: processes
          }).then(
            () => res.status(200).json(response)
          ).catch(
            () => res.status(200).json(response)
          );
        }
      );
    }
  ).catch(
    (err) => {
      vmCtrl.updateVM(ip, {
        isAdbConnected: false
      }).then(
        () => res.status(500).send(err)
      );
    }
  );
};

export const CheckWechatForegroundSchema = {
  "params": {
    ip: Joi.string().regex(/^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}:\d+$/).required()
  }
};

export const checkWechatForeground = (req: Request, res: Response) => {
  const ip = req.params.ip;
  adbUtils.ensureDeviceConnect(ip).then(
    () => {
     return adbUtils.checkWechatForeground(ip).then(
        (isForeground) => {
          const response = {
            ip: ip,
            isWechatForeground: isForeground
          };
          return vmCtrl.updateVM(ip, {
            isAdbConnected: true,
            isWechatForeground: isForeground
          }).then(
            () => res.status(200).json(response)
          ).catch(
            () => res.status(200).json(response)
          );
        }
      );
    }
  ).catch(
    (err) => {
      vmCtrl.updateVM(ip, {
        isAdbConnected: false
      }).then(
        () => res.status(500).send(err)
      );
    }
  );
};

export const getVMs = (req: Request, res: Response) => {
  vmCtrl.getAllVMs().then(
    (vms) => res.status(200).json(vms),
    (err) => res.status(500).send(err)
  );
};

export const GetVMInfoSchema = {
  "params": {
    ip: Joi.string().regex(/^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}:\d+$/).required()
  }
};

export const getVMInfo = (req: Request, res: Response) => {
  const ip = req.params.ip;
  vmCtrl.getVMInfo(ip).then(
    (vmInfo) => res.status(200).json(vmInfo),
    (err) => res.status(500).send(err)
  );
};

export const ReconnectAdbSchema = {
  "params": {
    ip: Joi.string().regex(/^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}:\d+$/).required()
  }
};

export const reconnectAdb = (req: Request, res: Response) => {
  const ip = req.params.ip;
  retry(3, () => {
    return adbUtils.ensureDeviceConnect(ip).catch(
      () => {
        return adbUtils.disconnectDevice(ip).then(
          () => Promise.reject(false)
        );
      }
    );
  }, 3000).then(
    () => {
      const response = {
        ip: ip,
        isAdbConnected: true
      };
      return vmCtrl.updateVM(ip, {
        isAdbConnected: true,
      }).then(
        () => res.status(200).json(response)
        ).catch(
        () => res.status(200).json(response)
      );
    },
    () => {
      logger.error("Try to adb connect device(%s) 3 times, but failed", ip);
      const response = {
        ip: ip,
        isAdbConnected: false
      };
      return vmCtrl.updateVM(ip, {
        isAdbConnected: false,
      }).then(
        () => res.status(200).json(response)
        ).catch(
        () => res.status(200).json(response)
      );
    }
  );
};

export const ForegroundWechatSchema = {
  "params": {
    ip: Joi.string().regex(/^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}:\d+$/).required()
  }
};

export const foregroundWechat = (req: Request, res: Response) => {
  const ip = req.params.ip;
  adbUtils.ensureDeviceConnect(ip).then(
    () => {
      return adbUtils.callWechatToForeground(ip).then(
        () => {
          const response = {
            ip: ip,
            isWechatForeground: true
          };     
          return vmCtrl.updateVM(ip, {
            isWechatForeground: true
          }).then(
            () => res.status(200).json(response)
          ).catch(
            () => res.status(200).json(response)
          );
        }
      ).catch(
        () => res.status(500).send("can not call wechat to foreground")
      );
    },
    () => {
      return vmCtrl.updateVM(ip, {
        isAdbConnected: false,
      }).then(
        () => res.status(500).send("device is not connected by adb")
        ).catch(
        () => res.status(500).send("device is not connected by adb")
      );
    }
  );
};