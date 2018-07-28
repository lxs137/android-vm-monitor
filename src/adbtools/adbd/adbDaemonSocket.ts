import { Socket } from "net";
import { EventEmitter } from "events";
import { PacketReader } from "./packetReader";

export class AdbDaemonSocket extends EventEmitter {
  private isEnd: boolean = false;
  private socket: Socket;
  private reader: PacketReader;

  constructor(deviceID: string, conn: Socket) {
    super();
    this.isEnd = false;
    this.reader = new PacketReader(conn);
  }

  public end() {
    if(this.isEnd)
      return;
    this.socket.end();
    this.isEnd = true;
    this.emit("end");
  }
}