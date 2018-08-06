import { Transform, TransformOptions, TransformCallback } from "stream";
const logger = require("log4js").getLogger("commandReply");

/** 
 * Input stream, output packets 
 */
export class CommandReplyStream extends Transform {
  private buffer: CommandReplyBuffer;
  private isEmpty: boolean = true;
  
  constructor(packetLen: number, streamOpt?: TransformOptions) {
    super({
      writableObjectMode: true,
      readableObjectMode: true,
      ...streamOpt
    });
    this.buffer = new CommandReplyBuffer(packetLen);
  }

  _transform(chunk: any, encoding: string, callback: TransformCallback) {
    if(!Buffer.isBuffer(chunk))
      chunk = new Buffer(chunk, encoding);
    this.buffer.addData(chunk);
    if (this.isEmpty) {
      this.isEmpty = false;
      this.emit("hasData");
    }
    let packet;
    while(packet = this.buffer.getPacket()) {
      this.push(packet);
    }
    callback();
  }

  public forceFlush() {
    const remainData = this.getRemainData();
    if(remainData && remainData.length >= 1)
      this.push(remainData);
  }

  public getRemainData(): Buffer {
    return this.buffer.getRemainData();
  }
}

export class CommandReplyBuffer {
  private cache: Buffer;
  private packetLen: number;
  private packets: Buffer[];

  constructor(lenPerPacket: number) {
    this.packetLen = lenPerPacket;
    this.cache = new Buffer(0);
    this.packets = [];
  }

  public addData(buf: Buffer) {
    if(!buf || buf.length <= 0)
      return;
    const mergeLen = this.cache.length + buf.length;
    this.cache = Buffer.concat([this.cache, buf], mergeLen);
    if(mergeLen >= this.packetLen)
      this.cutToPacket();
  }

  public getPacket(): Buffer {
    if(this.packets.length >= 1)
      return this.packets.pop();
    else
      return undefined;
  }

  public getRemainData(): Buffer {
    const data = this.cache;
    this.cache = this.cache.slice(this.cache.length);
    return data;
  }

  private cutToPacket() {
    const packetCount = Math.floor(this.cache.length / this.packetLen);
    for(let i = 0; i < packetCount; i++) {
      const packet = new Buffer(this.packetLen);
      this.cache.copy(packet, 0, i * this.packetLen, (i + 1) * this.packetLen);
      this.packets.push(packet);
    }
    this.cache = this.cache.slice(packetCount * this.packetLen);
  }
}