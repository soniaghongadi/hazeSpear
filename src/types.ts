export type IoTMessage = {
  messageId: number;
  value: number;
  timestamp: string;
};

export type IoTDevice = {
  messages: Array<IoTMessage>;
  deviceId: string;
};

export enum MESSAGETYPE {
  REGISTER_FOG_ID,
}

export type PeerCommandMessage = {
  messageType: MESSAGETYPE;
  message: any;
};
