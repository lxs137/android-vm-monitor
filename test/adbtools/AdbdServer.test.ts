import * as net from "net";
import * as log4js from "log4js";
import { ensureDeviceConnect } from "utils/adbUtils";
import { AdbDaemonServer } from "adbtools/adbd/adbDaemonServer";

describe("Adb Daemon Server Test", () => {
  const serverPort = 20001;
  const deviceID = "114.212.189.146:10001";
  let server: AdbDaemonServer;
  
  beforeAll((done) => {
    log4js.configure({
      appenders: {
        console: { type: "console" }
      },
      categories: {
        default: { appenders: ["console"], level: "debug" }
      }
    });
    server = new AdbDaemonServer(deviceID, () => true);
    server.listen({
      port: serverPort
    });
    done();
  });

  // it("Test connect to server", (done) => {
  //   const socket = net.connect({
  //     port: serverPort
  //   });
  //   socket.on("connect", () => {
  //     done();
  //   });
  // });

  it("Test adb connect", (done) => {
    // setTimeout(() => done(), 60000);
    ensureDeviceConnect("localhost:" + serverPort).then(
      () => done(),
      (err) => {
        console.error(err.message);
      }
    );
  }, 60000);

  afterAll((done) => {
    server.close();
  });
});