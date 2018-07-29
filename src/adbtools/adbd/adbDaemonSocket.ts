import { Socket } from "net";
import { EventEmitter } from "events";
import { randomBytes } from "crypto";
import { parsePublicKey } from "../utils/auth";
import { PacketReader } from "./packetReader";
import { Packet, PacketCommand, AuthPacketType } from "./packet";
const logger = require("log4js").getLogger("adbDaemonSocket");

const UINT32_MAX = 0xFFFFFFFF;
const UINT16_MAX = 0xFFFF;
const TOKEN_LENGTH = 20;

export class AdbDaemonSocket extends EventEmitter {
  private isEnd: boolean = false;
  private socket: Socket;
  private reader: PacketReader;
  private syncSeq: Counter = new Counter(UINT32_MAX);
  private maxPayload: number = 4096;
  private token: Buffer;
  private signature: Buffer;

  constructor(deviceID: string, conn: Socket) {
    super();
    this.isEnd = false;
    this.reader = new PacketReader(conn);
    this.reader.on("packet", (packet: Packet) => this.handlePacket(packet));
    this.reader.on("error", (err: Error) => {
      logger.error("Read Packet error: %s", err.message);
      this.end();
    });
    this.reader.on("end", () => this.end());
  }

  private handlePacket(packet: Packet) {
    if(this.isEnd)
      return;
    logger.debug("Input packet: %s", packet.toString());
    try {
      switch (packet.command) {
        case PacketCommand.A_AUTH:
          this.handleAuthPacket(packet); break;
        case PacketCommand.A_CLSE:
          break;
        case PacketCommand.A_CNXN:
          this.handleConnectPacket(packet); break;
        case PacketCommand.A_SYNC:
          this.handleSyncPacket(packet); break;
        default:
          break;
      }      
    } catch (error) {
      logger.error("Handle packet error: %s", error.message);
    }
  }

  private handleAuthPacket(packet: Packet) {
    switch (packet.arg0) {
      case AuthPacketType.SIGNATURE:
        this.signature = packet.data;
        if(!this.signature)
          return;
        // This is a fake Android device, doesn't has public key
        // So sign failed, send Auth(Token) msg as response
        // Another side will use other PrivateKey to sign this token
        this.write(Packet.genSendPacket(PacketCommand.A_AUTH, 
          AuthPacketType.TOKEN, 0, this.token));
        break;
      case AuthPacketType.RSAPUBLICKEY:
        if(!this.signature) {
          logger.error("Public key sent before signature");
          return;
        }
        if(!(packet.data && packet.data.length >= 1)) {
          logger.error("Empty RSA public Key");
          return;
        }
        // Skip null in data
        const notNullData = packet.data.slice(0, -1);
        parsePublicKey(notNullData).then(
          (key) => {
            key.verify();
          },
        );
        break;
    }
  }

  private handleConnectPacket(packet: Packet) {
    this.maxPayload = Math.min(UINT16_MAX, packet.arg1);
    randomBytes(TOKEN_LENGTH, (err, token) => {
      if(err) {
        logger.error("Create random token err: %s", err.message);
        return;
      }
      this.token = token;
      logger.debug("Create token: %s", token.toString("base64"));
      this.write(Packet.genSendPacket(PacketCommand.A_AUTH,
         AuthPacketType.TOKEN, 0, this.token));
    });
  }

  private handleSyncPacket(packet: Packet) {
    this.write(Packet.genSendPacket(PacketCommand.A_SYNC, 1, 
      this.syncSeq.next(), undefined));
  }

  public write(packet: Packet) {
    if(this.isEnd)
      return;
    logger.debug("Output packet: %s", packet.toString());
    this.socket.write(packet.toBuffer());
  }

  public end() {
    if(this.isEnd)
      return;
    this.socket.end();
    this.isEnd = true;
    this.emit("end");
  }
}

export class Counter {
  private cur: number;
  private max: number;
  private min: number;
  constructor(max: number, min: number = 1) {
    this.cur = min;
    this.max = max;
    this.min = min;
  }
  public next() {
    if(this.cur < this.max)
      this.cur++;
    else
      this.cur = this.min + 1;
    return this.cur;
  }
}