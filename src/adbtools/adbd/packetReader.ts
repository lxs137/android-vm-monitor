
import { EventEmitter } from "events";
import { Readable } from "stream";
import { Packet } from "./packet";

export class PacketReader extends EventEmitter {
  private inBody: boolean = false;
  private buffer: Buffer; 
  private packet: Packet;
  private stream: Readable;

  constructor(stream: Readable) {
    super();
    this.stream = stream;
    stream.on("readable", () => {
      this.read();
    });
    stream.on("error", (err) => this.emit("error", err));
    stream.on("end", () => this.emit("end"));
  }

  private read() {
    while(this.getChunk()) {
      while(this.buffer) {
        // Adb Packet contains a 24 byte head and body
        if(this.inBody) {
          if(this.buffer.length < this.packet.length)
            break;
          this.packet.data = this.readBuffer(this.packet.length);
          if(!this.packet.verifyChecksum()) {
            this.emit("error", new PacketCheckSumError(this.packet));
            return;
          }
          this.emit("packet", this.packet);
          this.inBody = false;
        } else {
          if(this.buffer.length < 24)
            return;
          const header = this.readBuffer(24);
          this.packet = Packet.fromBuffer(header);
          if(!this.packet.verifyMagic()) {
            this.emit("error", new PacketMagicError(this.packet));
            return;
          }
          if(this.packet.length === 0) {
            this.emit("packet", this.packet);
          } else {
            this.inBody = true;
          }
        }
      }
    }
  }

  private getChunk(): boolean {
    const chunk: Buffer = this.stream.read();
    if(!chunk)
      return false;
    if(this.buffer) {
      this.buffer = Buffer.concat([this.buffer, chunk], this.buffer.length + chunk.length);
    } else {
      this.buffer = chunk;
    }
    return true;
  }

  private readBuffer(length: number): Buffer {
    const chunk = this.buffer.slice(0, length);
    this.buffer = (this.buffer.length === length) ? undefined : this.buffer.slice(length);
    return chunk;
  }
}

export class PacketCheckSumError extends Error {
  packet: Packet;
  constructor(packet: Packet) {
    super();
    this.packet = packet;
    this.name = "PacketCheckSumError";
    this.message = "Packet's checksum is not match";
    Error.captureStackTrace(this, PacketCheckSumError);
  }
}

export class PacketMagicError extends Error {
  packet: Packet;
  constructor(packet: Packet) {
    super();
    this.packet = packet;
    this.name = "PacketmagicError";
    this.message = "Packet's magic is not match command";
    Error.captureStackTrace(this, PacketMagicError);
  }
}