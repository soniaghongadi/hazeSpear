export type IoTMessage = {
    deviceId: string;
    value: number;
    timestamp: string;
    counter: number;
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

export enum DeviceType {
    FOG,
    SENSOR,
}

export type Device = {
    id: string;
    deviceType: DeviceType;
    community?: string | undefined;
};

export type SensorDevice = {
    id: string;
    deviceType: DeviceType;
    community?: string | undefined;
    governingFog: string;
};

export type Community = {
    device: Device;
    id: string;
};

export type FogAssignementToSensor = {
    id: string;
};

export const COMMANDS = {
    FORM_COMMUNITY: "FORM_COMMUNITY",
    SYNC_DATA: "SYNC_DATA",
};
