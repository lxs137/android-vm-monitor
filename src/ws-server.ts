import * as http from "http";
import * as ws from "ws";
import * as queryString from "query-string";
import * as miniCapUtils from "utils/miniCapUtils";
import * as heartbeat from "utils/heartbeat";
import { getLogger } from "log4js";
const logger = getLogger("websocket");

class WsClientsMap {
  ClientsMap: { [key: string]: Set<ws> } = {};
  addClient(ip: string, socketClient: ws) {
    if(!this.ClientsMap[ip]) {
      this.ClientsMap[ip] = new Set();
    }
    this.ClientsMap[ip].add(socketClient);
  }
  removeClient(ip: string, socketClient: ws) {
    if(!this.ClientsMap[ip])
      return;
    this.ClientsMap[ip].delete(socketClient);
  }
  hasClients(ip: string): boolean {
    return this.ClientsMap[ip].size >= 1 ? true : false;
  }
  doForIP(ip: string, action: (webSocket: ws) => void) {
    if(!this.ClientsMap[ip])
      return;
    this.ClientsMap[ip].forEach((ws) => {
      action(ws);
    });
  }
}

const WebSocketClients: WsClientsMap = new WsClientsMap();

export const initWsServer = (httpServer: http.Server) => {
  const wsServer = new ws.Server({
    server: httpServer
  }, () => {
    logger.info("WebSocket Server listen on %d", httpServer.address.toString());
  });

  wsServer.on("connection", handleConnection);

  const pingPongHeartbeatTag = "WebsocketPingPong";

  wsServer.on("error", () => {
    heartbeat.stop(pingPongHeartbeatTag);
  });
  
  heartbeat.start({
    tag: pingPongHeartbeatTag,
    action: () => {
      wsServer.clients.forEach((ws) => {
        if ((<any>ws).isAlive === false)
          return ws.terminate();
        (<any>ws).isAlive = false;
        ws.ping(() => {
          logger.debug("Send ping message: %s", ws.extensions);
        });
      });
    },
    interval: 30000
  });
};

export const handleConnection = (ws: ws, req: http.IncomingMessage) => {
  logger.info("Receive Connection: %s", req.url);
  const { url, query } = queryString.parseUrl(req.url);
  if (!url.endsWith("/minicap/")) {
    ws.close();
    logger.error("url is error: %s", url);
    return;
  }
  const { ip } = query;
  ws.on("close", function() {
    logger.info("WebSocket(%s) Close", req.url);
    WebSocketClients.removeClient(ip, this);
    if(!WebSocketClients.hasClients(ip)) {
      logger.info("Stop Adb forward for device %s", ip);
      miniCapUtils.disconnect(ip);
    }
  });
  ws.on("pong", function() {
    logger.debug("Receive pong message: %s", this.extensions);
    (<any>this).isAlive = true;
  });
  WebSocketClients.addClient(ip, ws);
  if (!miniCapUtils.isDeviceBeForward(ip)) {
    miniCapUtils.forwardToLocalPort(ip).then(
      () => {
        miniCapUtils.connect(ip, (data) => {
          WebSocketClients.doForIP(ip, (wsClient) => {
            wsClient.send(data, {
              binary: true
            }, (err) => {
              if (err) {
                logger.error("Send websocket message has some error: %s", err.message);
              } else {
                logger.debug("Send websocket message complete");
              }
            });
          });
        }, (err) => {
          logger.error("Minicap connect has some error: %s", err);
          WebSocketClients.doForIP(ip, (wsClient) => {
            wsClient.close();
          });
        });
      }
    ).catch(
      (err) => {
        logger.info("Adb forward has some error: %s", err);
        ws.close();
      });
  }
};
