import { Transform, TransformOptions, TransformCallback } from "stream";

/** 
 * Input stream, output packets 
 */
export class CommandReplyStream extends Transform {
  private buffer: CommandReplyBuffer;
  
  constructor(packetLen: number, streamOpt?: TransformOptions) {
    super({
      writableObjectMode: true,
      ...streamOpt
    });
    this.buffer = new CommandReplyBuffer(packetLen);
  }

  _transform(chunk: any, encoding: string, callback: TransformCallback) {
    if(!Buffer.isBuffer(chunk))
      chunk = new Buffer(chunk, encoding);
    this.buffer.addData(chunk);
    let packet;
    while(packet = this.buffer.getPacket()) {
      this.push(packet);
    }
    callback();
  }

  _flush(callback: TransformCallback) {
    this.push(this.buffer.getRemainData());
    callback();
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
    return this.cache;
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