const log4js = require("log4js");
const adbd = require("./dist/adbtools/adbd/adbDaemonServer");

log4js.configure({
	appenders: {
		console: { type: "console" }
	},
	categories: {
		default: { appenders: ["console"], level: "debug" }
	}
});
const server = new adbd.AdbDaemonServer("114.212.189.146:10001", () => true);
server.listen({
	port: 20001
});