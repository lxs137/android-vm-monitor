import { Command } from "adbtools/commands/command";
import { AdbServerConnection } from "adbtools/commands/adbServerConn";
import { CommandParser, ResponseCode } from "adbtools/commands/commandParser";

export class TransportCommand extends Command {
  private deviceID: string;
  constructor(connection: AdbServerConnection, deviceID: string) {
    super(connection);
    this.deviceID = deviceID;
  }
  public execute(): Promise<any> {
    return this.send(`host:transport:${this.deviceID}`).then(
      () => this.parser.readASCII(4)
    ).then(
      (response) => {
        if(response === ResponseCode.OKAY) {
          return Promise.resolve();
        } else if(response === ResponseCode.FAIL) {
          return this.parser.readError();
        } else {
          return Promise.reject(
            new Error("Unexpected response('OKAY' or 'FAIL'): " + response));
        }
      }
    );
  }
}