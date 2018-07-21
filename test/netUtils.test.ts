import * as netUtils from "../src/utils/netUtils";

describe("Net Utils Test", () => {
  const validIP = "114.212.80.19";
  const inValidIP = "216.58.220.206";
  it("Ping Valid IP", (done) => {
    netUtils.checkIP(validIP).then(
      (isValid) => {
        if(isValid)
          done();
      }
    );
  });

  it("Ping inValid IP", (done) => {
    netUtils.checkIP(inValidIP).then(
      (isValid) => {
        if(!isValid)
          done();
      }
    );
  });
});