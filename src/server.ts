import * as errorHandler from "errorhandler";
import * as express from "express";
import * as http from "http";
import { initWsServer } from "./ws-server";
import * as adbUtils from "utils/adbUtils";
import { getLogger } from "log4js";
const logger = getLogger("server");

const app: express.Express = require("./app");

/**
 * Error Handler. Provides full stack - remove for production
 */
if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
  app.use(errorHandler());
}

/**
 * Start Express server.
 */
// const server = app.listen(app.get("port"), () => {
//   logger.info(("  App is running at http://localhost:%d in %s mode"), app.get("port"), app.get("env"));
//   logger.info("  Press CTRL-C to stop\n");
// });
const server = http.createServer(app);

initWsServer(server);

server.on("close", () => {
  adbUtils.disconnectAll();
});

process.on("SIGINT", () => {
  adbUtils.disconnectAll();
});

process.on("exit", () => {
  adbUtils.disconnectAll();
});

server.listen(app.get("port"), () => {
  logger.info(("  App is running at http://localhost:%d in %s mode"), app.get("port"), app.get("env"));
  logger.info("  Press CTRL-C to stop\n");
});


export = server;