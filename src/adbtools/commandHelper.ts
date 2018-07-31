import { AdbServerConnection } from "./commands/adbServerConn";
import { Command } from "./commands/command";
const logger = require("log4js").getLogger("adbCommandHelper");

export class CommandHelper {
  constructor() {
  }

  public connect(host: string = "localhost", port: number = 5037, adbPath: string = "adb"): Promise<AdbServerConnection> {
    return new Promise((resolve, reject) => {
      const connection = new AdbServerConnection({
        host: host,
        port: port,
        adbServerPath: adbPath
      });
      connection.on("error", (err) => {
        logger.error("AdbServerConnection err: %s", err);
        reject(err);
      });
      connection.on("connect", () => {
        resolve(connection);
      });
      connection.connect();
    });
  }

  public transport() {
    return this.connect().then(
      (conn) => {

      }
    );
  }

}