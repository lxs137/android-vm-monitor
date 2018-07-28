import { EventEmitter } from "events";
import { Socket, connect } from "net";
import { cmdFileExec } from "../utils/command";
const logger = require("log4js").getLogger("adbServerConn");

interface AdbServerConnectionOpt {
  host?: string;
  port?: number;
  adbServerPath?: string;
}

/**
 * Send command to local adbserver, command's format:
 * https://android.googlesource.com/platform/system/core/+/master/adb/SERVICES.TXT
 */
export class AdbServerConnection extends EventEmitter {
  private options: AdbServerConnectionOpt;
  private socket: Socket;

  constructor(connOptions: AdbServerConnectionOpt) {
    super();
    this.options = connOptions;
    this.socket = undefined;
  }

  public connect(): AdbServerConnection {
    this.socket = connect({
      host: this.options.host || "localhost",
      port: this.options.port || 5037
    });
    this.socket.setNoDelay(true);
    this.socket.on("connect", () => this.emit("connect"));
    this.socket.on("end", () => this.emit("end"));
    this.socket.on("error", this.onError);
    this.socket.on("close", () => this.emit("colse"));
    return this;
  }

  public close() {
    this.socket.end();
  }

  private onError(err: NodeJS.ErrnoException) {
    logger.debug("AdbServerConnection error: %s", err);
    if(err.code === "ECONNREFUSED") {
      cmdFileExec(this.options.adbServerPath || "adb", ["start-server"]).then(
        () => this.connect(),
        (execErr) => {
          this.emit("error", execErr);
          this.socket.end();
        }
      );
    } else {
      this.emit("error", err);
      this.socket.end();
    }
  }
}