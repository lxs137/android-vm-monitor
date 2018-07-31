import { Socket, Server, createServer } from "net";
import { EventEmitter } from "events";
import { AdbDaemonSocket, AdbDaemonAuthFunc } from "adbtools/adbd/adbDaemonSocket";
const logger = require("log4js").getLogger("adbDaemonServer");

/**
 * This server run on host to simulate an Android device's adbd
 */
export class AdbDaemonServer extends EventEmitter {
  private connections: AdbDaemonSocket[];
  private server: Server;

  constructor(deviceID: string, auth: AdbDaemonAuthFunc) {
    super();
    this.connections = [];
    this.server = createServer({
      allowHalfOpen: true
    });
    this.server.on("error", (err) => {
      logger.error("AdbDaemonServer error: %s", err.message);
      this.emit("error", err);
    });
    this.server.on("colse", () => {
      logger.info("AdbDaemonServer close");
      this.emit("close");
    });
    this.server.on("connection", (conn: Socket) => {
      const socket = new AdbDaemonSocket(deviceID, conn, auth);
      this.connections.push(socket);
      this.emit("connection", socket);
    });
  }

  /**
   * The Same as net.Server.listen 
   */
  public listen(...args: any[]) {
    this.server.listen(args);
  }

  public close() {
    this.server.close();
  }

  public end() {
    this.connections.forEach((conn) => conn.end());
  }
}