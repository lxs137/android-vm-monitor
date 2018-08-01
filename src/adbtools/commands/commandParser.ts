import { Socket } from "net";
import { decodeLength } from "adbtools/commands/encoder";

export const ResponseCode = {
  OKAY: "OKAY",
  FAIL: "FAIL",
  STAT: "STAT",
  LIST: "LIST",
  DENT: "DENT",
  RECV: "RECV",
  DATA: "DATA",
  DONE: "DONE",
  SEND: "SEND",
  QUIT: "QUIT"
};

export class CommandParser {
  private stream: Socket;
  private isEnd: boolean = false;

  constructor(stream: Socket) {
    this.stream = stream;
  }

  public discardAll(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.isEnd)
        return resolve(true);
      this.stream.on("readable", () => {
        while (this.stream.read())
          continue;
      });
      this.stream.once("error", (err) => {
        reject(err);
      });      
      this.stream.once("end", () => {
        this.isEnd = true;
        resolve(true);
      });
      this.stream.read(0);
      this.stream.end();
    });
  }

  public readAll(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      let data = new Buffer(0);
      if(this.isEnd)
        return resolve(data);
      this.stream.on("readable", () => {
        let chunk;
        while(chunk = this.stream.read()) {
          data = Buffer.concat([data, chunk]);
        }
        if(this.isEnd)
          return resolve(data);
      });
      this.stream.once("error", (err) => {
        reject(err);
      });
      this.stream.once("end", () => {
        this.isEnd = true;
        resolve(data);
      });
      this.stream.read(0);
    });
  }

  public readBytes(len: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const moreBytesErr = new Error("Need more bytes to read");
      if (len === 0) {
        return resolve(new Buffer(0));
      } else if(this.isEnd) {
        return reject(moreBytesErr);
      }
      this.stream.once("readable", () => {
        let chunk: Buffer;
        if (chunk = this.stream.read(len)) {
          if(len === chunk.length)
            return resolve(chunk);
        }
        return reject(moreBytesErr);
      });
      this.stream.once("error", (err) => {
        reject(err);
      });
      this.stream.once("end", () => {
        this.isEnd = true;
        reject(moreBytesErr);
      });
      this.stream.read(0);
    });
  }

  public readASCII(len: number): Promise<string> {
    return this.readBytes(len).then(
      (data) => data.toString("ascii")
    );
  }

  public readValue(): Promise<Buffer> {
    return this.readASCII(4).then(
      (header) => {
        const len = decodeLength(header);
        return this.readBytes(len);
      }
    );
  }

  public readError(): Promise<void> {
    return this.readValue().then(
      (data) => {
        return Promise.reject(new Error(data.toString()));
      }
    );
  }
}