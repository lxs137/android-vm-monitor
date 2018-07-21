import * as adbUtils from "../src/utils/adbUtils";

describe("Adb Utils Test", () => {
  const deviceIP = "192.168.1.154:5555";
  it("ensure device connect", (done) => {
    adbUtils.ensureDeviceConnect(deviceIP).then(
      () => done()
    ).catch(
      info => console.log(info)
    );
  });

  it("check wechat LauncherUI foreground", (done) => {
    adbUtils.checkWechatForeground(deviceIP).then(
      (isForeground) => {
        if(isForeground)
          done();
      }
    );
  });

  it("get wechat process list", (done) => {
    adbUtils.getWechatProcess(deviceIP).then(
      (psList) => {
        console.log(psList.length);
        if(psList && psList instanceof Array && psList.length >= 1)
          done();
      }
    );
  });

  it("call wechat to foreground", (done) => {
    adbUtils.ensureDeviceConnect(deviceIP).then(
      () => {
        adbUtils.callWechatToForeground(deviceIP).then(
          () => done()
        );
      }
    );
  });
});