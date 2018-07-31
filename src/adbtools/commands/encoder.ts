export const encode = (str: string): Buffer => {
  const data = new Buffer(str);
  const header = new Buffer(encodeLength(data.length));
  return Buffer.concat([header, data]);
};

export const encodeLength = (len: number): string => {
  return ("0000" + len.toString(16)).slice(-4).toUpperCase();
};

export const decodeLength = (str: string): number => {
  return parseInt(str, 16);
}