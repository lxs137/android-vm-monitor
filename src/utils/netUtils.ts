const ping  = require("ping");

const PingOption = {
  timeout: 4,
  min_reply: 3
};

export const checkIP = (ip: string): Promise<boolean> => {
  const parseIP = ip.match(/(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]\d|\d)){3}/);
  if(!parseIP) {
    return Promise.resolve(false);
  }
  return ping.promise.probe(parseIP[0], PingOption).then(
    (res: any) => Promise.resolve(res.alive)
  ).catch(
    () => Promise.resolve(false)
  );
};