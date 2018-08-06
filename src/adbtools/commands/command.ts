import { EventEmitter } from "events";
import { CommandParser } from "adbtools/adb-server/commandParser";
import { encode } from "adbtools/adb-server/encoder";
import { AdbServerConnection } from "adbtools/adb-server/adbServerConn";
const logger = require("log4js").getLogger("command");

export abstract class Command {
  protected conn: AdbServerConnection;
  protected parser: CommandParser;
  constructor(connection: AdbServerConnection) {
    this.conn = connection;
    this.parser = connection.parser;
  }
  
  public abstract execute(): Promise<any>;

  protected send(str: string): Promise<any> {
    return new Promise((resolve, reject) => {
      logger.info("Send command: %s", str);
      this.conn.send(encode(str), () => {
        resolve(str);
      });
    });
  }
}

