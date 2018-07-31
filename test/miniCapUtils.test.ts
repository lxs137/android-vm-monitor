import * as miniCapUtils from "utils/miniCapUtils";

describe("MiniCap Utils Test", () => {
  const adbIP = "192.168.1.154:5555";
  it("Forward minicap to local port", (done) => {
    miniCapUtils.forwardToLocalPort(adbIP).then(
      () => done()
    ).catch(
      (err) => {
        console.log(err);
      }
    );
  });
}); 