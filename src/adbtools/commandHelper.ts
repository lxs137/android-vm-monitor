import { AdbServerConnection } from "adbtools/commands/adbServerConn";
import { CommandParser } from "adbtools/commands/commandParser";
import { GetPropCommand } from "adbtools/commands/getProp";
import { TransportCommand } from "adbtools/commands/transport";
const logger = require("log4js").getLogger("adbCommandHelper");

export class CommandHelper {

  public static connect(host: string = "localhost", port: number = 5037, adbPath: string = "adb"): Promise<AdbServerConnection> {
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

  public static getDeviceProps(deviceID: string): Promise<any> {
    return this.transport(deviceID).then(
      (conn) => {
        const cmd = new GetPropCommand(conn);
        return cmd.execute().then(
          (props) => props,
          (err) => logger.error("GetProps error: %s", err.message)
        );
      }
    );
  }

  private static transport(deviceID: string): Promise<AdbServerConnection> {
    return this.connect().then(
      (conn) => {
        const cmd = new TransportCommand(conn, deviceID);
        return cmd.execute().then(
          () => Promise.resolve(conn),
          (err) => logger.error("Transport error: %s", err.message)
        );
      }
    );
  }

}