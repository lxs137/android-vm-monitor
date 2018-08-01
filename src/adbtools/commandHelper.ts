import { AdbServerConnection, CommandParser, GetPropCommand, TransportCommand, ConnectDeviceCommand } from "adbtools/commands";
const logger = require("log4js").getLogger("adbCommandHelper");

export class CommandHelper {

  public static connect(host: string = "localhost", port: number = 5037, adbPath: string = "adb"): Promise<AdbServerConnection> {
    return new Promise((resolve, reject) => {
      const connection = new AdbServerConnection({
        host: host,
        port: port,
        adbServerPath: adbPath
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
          (err) => Promise.reject(new Error(
            `Get Properties error: ${err.message}`
          ))
        );
      }
    );
  }

  public static connectDevice(deviceID: string): Promise<AdbServerConnection> {
    return this.connect().then(
      (conn) => {
        const cmd = new ConnectDeviceCommand(conn, deviceID);
        return cmd.execute().then(
          () => Promise.resolve(conn),
          (err) => Promise.reject(new Error(
            `Connect to device(${deviceID}) err: ${err.message}`
          ))
        );
      }
    );
  }

  private static transport(deviceID: string): Promise<AdbServerConnection> {
    return this.connectDevice(deviceID).then(
      () => this.connect()
    ).then(
      (conn) => {
        const cmd = new TransportCommand(conn, deviceID);
        return cmd.execute().then(
          () => Promise.resolve(conn),
          (err) => Promise.reject(new Error(
            `Transport to ${deviceID} error: ${err.message}`
          ))
        );
      }
    );
  }

}