import { Response, Request, NextFunction, Router } from "express";
import { validate } from "middlewares/reqTypeValidate";
import * as vmAPI from "apis/vmAPI";

const indexRouter = Router();

/* GET home page. */
indexRouter.get("/", (req: Request, res: Response) => {
  res.status(200).send("ok");
});

/**
 * 获取虚拟机列表
 * @response
 *    [{ name: string, wxid: string, ip: string }]
 */
indexRouter.get("/vms", vmAPI.getVMs);

/**
 * 获取虚拟机详细信息
 * @params
 *    ip: string
 * @response
 *    { name: string, ip: string, wxid: string, nickname: string, psList: string[], isNetConnected: boolean, isAdbConnected: boolean, isWechatForeground: boolean, updateTime: Date }
 */
indexRouter.get("/vm/:ip", validate(vmAPI.GetVMInfoSchema), vmAPI.getVMInfo);

/**
 * 获取虚拟机网络连接状态
 * @params
 *    ip: string
 * @response
 *    { ip: string, isNetConnected: boolean }
 */
indexRouter.get("/vm/:ip/status/net", validate(vmAPI.CheckNetConnectedSchema), vmAPI.checkNetConnected);

/**
 * 获取虚拟机Adb连接状态
 * @params
 *    ip: string
 * @response
 *    { ip: string, isAdbConnected: boolean }
 */
indexRouter.get("/vm/:ip/status/adb", validate(vmAPI.CheckAdbConnectedSchema), vmAPI.checkAdbConnected);

/**
 * 获取虚拟机微信界面是否在前台
 * @params
 *    ip: string
 * @response
 *    { ip: string, isWechatForeground: boolean }
 */
indexRouter.get("/vm/:ip/status/wechat", validate(vmAPI.CheckWechatForegroundSchema), vmAPI.checkWechatForeground);

/**
 * 获取虚拟机中微信进程
 * @params
 *    ip: string
 * @response
 *    { ip: string, psList: string[] }
 */
indexRouter.get("/vm/:ip/status/ps", validate(vmAPI.GetWechatProcessesSchema), vmAPI.getWechatProcesses);

/**
 * adb重新连接
 * @params
 *    ip: string
 * @response
 *    { ip: string, isAdbConnected: boolean }
 */
indexRouter.post("/vm/:ip/status/adb", validate(vmAPI.ReconnectAdbSchema), vmAPI.reconnectAdb);

/**
 * 将微信唤起到前台
 * @params
 *    ip: string
 * @response
 *    { ip: string, isWechatForeground: boolean }
 */
indexRouter.post("/vm/:ip/status/wechat", validate(vmAPI.ForegroundWechatSchema), vmAPI.foregroundWechat);

export default indexRouter;
