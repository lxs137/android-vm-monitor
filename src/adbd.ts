import * as log4js from "log4js";
import { AdbDaemonServer } from "adbtools/adbd/adbDaemonServer";

log4js.configure({
  appenders: {
    console: { type: "console" }
  },
  categories: {
    default: { appenders: ["console"], level: "debug" }
  }
});
const server = new AdbDaemonServer("114.212.189.146:10001", () => true);
server.listen({
  port: 20001
});