import { Socket, Server, createServer } from "net";
import { EventEmitter } from "events";
import { pki } from "node-forge";
import { AdbDaemonSocket } from "./adbDaemonSocket";
const logger = require("log4js").getLogger("adbDaemonServer");

interface AdbDaemonAuthFunc {
  (key: pki.Certificate): Promise<any>;
}

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
      const socket = new AdbDaemonSocket(deviceID, conn);
      this.connections.push(socket);
      this.emit("connection", socket);
    });
  }

  public close() {
    this.server.close();
  }

  public end() {
    this.connections.forEach((conn) => conn.end());
  }
}