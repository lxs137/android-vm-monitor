import * as net from "net";
import * as adbUtils from "./adbUtils";
import * as netUtils from "./netUtils";
import { getLogger } from "log4js";
const logger = getLogger("miniCapUtils");

const MinicapStreams: { [key: string]: net.Socket } = {};
const AdbForwardPorts: { [key: string]: number } = {};

const getNotUsePort = (() => {
  let offset = 0;
  return () => {
    offset++;
    return 1717 + offset % 50;
  };
})();

export const isDeviceBeForward = (ip: string): boolean => {
  return AdbForwardPorts[ip] != undefined && MinicapStreams[ip] != undefined;
};

export const forwardToLocalPort = (ip: string): Promise<any> => {
  return netUtils.checkIP(ip).then(
    (checkResult) => {
      if(!checkResult) {
        logger.error("ip(%s) is not connected, can not forward to local port", ip);
        return Promise.reject("IP is not connected");
      }
      return Promise.resolve(true);
    } 
  ).then(
    () => {
      if(AdbForwardPorts[ip] && !MinicapStreams[ip]) {
        const localPort = AdbForwardPorts[ip];
        logger.info("localport(%d) has been forward but no stream used, try to disable it", localPort);
        return adbUtils.disableForwardPort(localPort).then(
          () => Promise.resolve(true)
        ).catch(
          () => Promise.resolve(true)
        );
      }
      return Promise.resolve(true);
    }
  ).then(
    () => adbUtils.ensureDeviceConnect(ip)
  ).then(
    () => {
      const localPort = getNotUsePort();
      return adbUtils.forwardProcessToLocalPort(ip, "minicap", localPort).then(
        () => {
          logger.info("Adb forward -s %s tcp:%d for minicap", ip, localPort);
          AdbForwardPorts[ip] = localPort;
          return Promise.resolve(true);
        }
      );
    }
  );
};

export const connect = (ip: string, readData: (data: Buffer) => void, connectErr: (err: string) => void) => {
  if(!AdbForwardPorts[ip]) {
    logger.error("Be sure to run \'adb forward\' for %s", ip);
    connectErr("Not run adb forward");
    return;
  }
  if(!MinicapStreams[ip]) {
    MinicapStreams[ip] = net.connect({
      port: AdbForwardPorts[ip]
    });
  }
  const stream = MinicapStreams[ip];
  stream.on("error", (err) => connectErr(err.message));

  let readBannerBytes = 0;
  let bannerLength = 2;
  let readFrameBytes = 0;
  let frameBodyLength = 0;
  let frameBody = new Buffer(0);
  const banner = {
    version: 0,
    length: 0,
    pid: 0,
    realWidth: 0,
    realHeight: 0,
    virtualWidth: 0,
    virtualHeight: 0,
    orientation: 0,
    quirks: 0
  };

  stream.on("readable", () => {
    for (let chunk; (chunk = stream.read());) {
      logger.debug("chunk(length=%d)", chunk.length);
      for (let cursor = 0, len = chunk.length; cursor < len;) {
        if (readBannerBytes < bannerLength) {
          switch (readBannerBytes) {
            case 0:
              // version
              banner.version = chunk[cursor];
              break;
            case 1:
              // length
              banner.length = bannerLength = chunk[cursor];
              break;
            case 2: case 3: case 4: case 5:
              // pid
              banner.pid += (chunk[cursor] << ((readBannerBytes - 2) * 8)) >>> 0;
              break;
            case 6: case 7: case 8: case 9:
              // real width
              banner.realWidth += (chunk[cursor] << ((readBannerBytes - 6) * 8)) >>> 0;
              break;
            case 10: case 11: case 12: case 13:
              // real height
              banner.realHeight += (chunk[cursor] << ((readBannerBytes - 10) * 8)) >>> 0;
              break;
            case 14: case 15: case 16: case 17:
              // virtual width
              banner.virtualWidth += (chunk[cursor] << ((readBannerBytes - 14) * 8)) >>> 0;
              break;
            case 18: case 19: case 20: case 21:
              // virtual height
              banner.virtualHeight += (chunk[cursor] << ((readBannerBytes - 18) * 8)) >>> 0;
              break;
            case 22:
              // orientation
              banner.orientation += chunk[cursor] * 90;
              break;
            case 23:
              // quirks
              banner.quirks = chunk[cursor];
              break;
          }
          cursor += 1;
          readBannerBytes += 1;
          if (readBannerBytes === bannerLength) {
            logger.debug("banner", banner);
          }
        }
        else if (readFrameBytes < 4) {
          frameBodyLength += (chunk[cursor] << (readFrameBytes * 8)) >>> 0;
          cursor += 1;
          readFrameBytes += 1;
          logger.debug("headerbyte%d(val=%d)", readFrameBytes, frameBodyLength);
        }
        else {
          if (len - cursor >= frameBodyLength) {
            logger.debug("bodyfin(len=%d,cursor=%d)", frameBodyLength, cursor);
            frameBody = Buffer.concat([
              frameBody,
              chunk.slice(cursor, cursor + frameBodyLength)
            ]);
            // Sanity check for JPG header, only here for debugging purposes.
            if (frameBody[0] !== 0xFF || frameBody[1] !== 0xD8) {
              logger.error("Frame body does not start with JPG header");
            } else {
              readData(frameBody);
            }

            cursor += frameBodyLength;
            frameBodyLength = readFrameBytes = 0;
            frameBody = new Buffer(0);
          }
          else {
            logger.debug("body(len=%d)", len - cursor);

            frameBody = Buffer.concat([
              frameBody,
              chunk.slice(cursor, len)
            ]);

            frameBodyLength -= len - cursor;
            readFrameBytes += len - cursor;
            cursor = len;
          }
        }
      }
    }
  });
};

export const disconnect = (ip: string) => {
  const stream = MinicapStreams[ip];
  const localPort = AdbForwardPorts[ip];
  if(localPort) {
    adbUtils.disableForwardPort(localPort).then(
      () => {
        delete AdbForwardPorts[ip];
        if(stream) {
          stream.end();
          delete MinicapStreams[ip];
        }
      }).catch(
        () => {
          if (stream) {
            stream.end();
            delete MinicapStreams[ip];
          }
        }
      );
  }
};