import { Socket } from "net";
import { EventEmitter } from "events";
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
        this.stream.removeAllListeners("readable");
        reject(err);
      });      
      this.stream.once("end", () => {
        this.isEnd = true;
        this.stream.removeAllListeners("readable");
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
      const tryRead = () => {
        let chunk;
        while (chunk = this.stream.read()) {
          data = Buffer.concat([data, chunk]);
        }
        if (this.isEnd) {
          this.stream.removeAllListeners("readable");
          return resolve(data);
        }
      };
      this.stream.on("readable", () => tryRead());
      this.stream.once("error", (err) => {
        this.stream.removeAllListeners("readable");
        reject(err);
      });
      this.stream.once("end", () => {
        this.isEnd = true;
        this.stream.removeAllListeners("readable");
        resolve(data);
      });
      // If the stream never be readable, this promise will also end
      tryRead();
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
      const tryRead = () => {
        let chunk: Buffer;
        if (chunk = this.stream.read(len)) {
          len -= chunk.length;
          if (len === 0) {
            this.stream.removeAllListeners("readable");            
            return resolve(chunk);
          }
        }
        if(this.isEnd) {
          this.stream.removeAllListeners("readable");
          return reject(moreBytesErr);
        }
      };
      this.stream.on("readable", () => tryRead());
      this.stream.once("error", (err) => {
        this.stream.removeAllListeners("readable");
        reject(err);
      });
      this.stream.once("end", () => {
        this.isEnd = true;
        this.stream.removeAllListeners("readable");
        reject(moreBytesErr);
      });
      // If the stream never be readable, this promise will also end
      tryRead();
    });
  }

  /**
   * Reader can emit "packet", "end", "error" events.
   * Reader can emit "packet" event when received lenPerPacket data.
   * If canPutData() is false, the reader is stop until canPutData be true. 
   * If there are no other data to read, the reader will emit "end" event 
   */
  public readToStream(lenPerPacket: number, canPutData: () => boolean, reader: EventEmitter) {
    if(!reader)
      return;
    if(lenPerPacket === 0) {
      reader.emit("end");
      return;
    }
    this.stream.on("readable", () => {
      if(!canPutData()) {
        return;
      } else {
        const chunk = this.stream.read(lenPerPacket) || this.stream.read();
        reader.emit("packet", chunk);
      }
    });

    this.stream.once("error", (err) => {
      this.stream.removeAllListeners("readable");
      reader.emit("error", err);
    });

    this.stream.once("end", () => {
      this.stream.removeAllListeners("readable");
      reader.emit("end");
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

  public readError(): Promise<string> {
    return this.readValue().then(
      (data) => {
        return Promise.resolve(data.toString());
      }
    );
  }
}