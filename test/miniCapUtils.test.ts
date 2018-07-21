import * as miniCapUtils from "../src/utils/miniCapUtils";

describe("MiniCap Utils Test", () => {
  const adbIP = "114.212.80.19:10001";
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