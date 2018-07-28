export const PacketCommand = {
  "A_SYNC": 0x434e5953, 
  "A_CNXN": 0x4e584e43,
  "A_OPEN": 0x4e45504f,
  "A_OKAY": 0x59414b4f,
  "A_CLSE": 0x45534c43,
  "A_WRTE": 0x45545257,
  "A_AUTH": 0x48545541
};

/** 
 * Adb Packet Format
 * struct message {
 *  unsigned command;       command identifier constant     
 *  unsigned arg0;          first argument                  
 *  unsigned arg1;          second argument                 
 *  unsigned data_length;   length of payload (0 is allowed)
 *  unsigned data_crc32;    crc32 of data payload           
 *  unsigned magic;         command ^ 0xffffffff            
 *  };
 */
export class Packet {
  readonly command: number;
  readonly arg0: number;
  readonly arg1: number;
  readonly length: number;
  readonly crc32: number;
  readonly magic: number;
  public data: Buffer;

  constructor(buffer: Buffer) {
    this.command = buffer.readUInt32LE(0);
    this.arg0 = buffer.readUInt32LE(4);
    this.arg1 = buffer.readUInt32LE(8);
    this.length = buffer.readUInt32LE(12);
    this.crc32 = buffer.readUInt32LE(16);
    this.magic = buffer.readUInt32LE(20);
    this.data = new Buffer(0);
  }

  public verifyChecksum() {
    return this.crc32 === checkSum(this.data);
  }

  public verifyMagic() {
    return this.magic === getMagic(this.command);
  }

  public toString(): string {
    let commandStr = "unknown";
    switch(this.command) {
      case PacketCommand.A_AUTH:
        commandStr = "AUTH"; break;
      case PacketCommand.A_CLSE:
        commandStr = "CLSE"; break;
      case PacketCommand.A_CNXN:
        commandStr = "CNXN"; break;
      case PacketCommand.A_OKAY:
        commandStr = "OKAY"; break;
      case PacketCommand.A_OPEN:
        commandStr = "OPEN"; break;
      case PacketCommand.A_SYNC:
        commandStr = "SYNC"; break;
      case PacketCommand.A_WRTE:
        commandStr = "WRTE"; break;
    }  
    return `${commandStr} arg0=${this.arg0} arg1=${this.arg1} length=${this.length}`;
  }
}

export const checkSum = (data: Buffer): number => {
  if (data && data.length > 0) {
    return data.reduce((preV, curV) => curV + preV, 0);
  } else {
    return 0;
  }
};

export const getMagic = (data: number): number => {
  return (data ^ 0xffffffff) >>> 0; 
};