import { AdbServerConnection } from "./adbServerConn";
const logger = require("log4js").getLogger("adbCommandHelper");

export class CommandHelper {
  connection: AdbServerConnection;
  constructor() {
    this.connection = new AdbServerConnection({
      host: "localhost",
      port: 5037,
      adbServerPath: "adb"
    });
    this.connection.connect();
  }

  initConnection(connectCb: (conn: AdbServerConnection) => void, errCb: (err: string) => void): Promise<any> {
    return new Promise((resolve, reject) => {
      this.connection = new AdbServerConnection({
        host: "localhost",
        port: 5037,
        adbServerPath: "adb"
      });
      this.connection.on("error", (err) => {
        logger.error("AdbServerConnection err: %s", err);
        reject(err);
      });
      this.connection.on("connect", () => {
        resolve();
      });
      this.connection.connect();
    });
  }
}