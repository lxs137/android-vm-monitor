const adbkitClient = require('adbkit').createClient();


const server = adbkitClient.createTcpUsbBridge("01ce8e1c90cdeb12", {
	auth: () => Promise.resolve()
}).on("listening", () => {
	console.info("Connect with adb connect");
}).on("error", (err) => {
	console.error("Bridge err: %s", err.message);
})  
server.listen(10001);