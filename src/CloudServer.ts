import {
  Device,
  DeviceType,
  FogAssignementToSensor,
  MESSAGETYPE,
  PeerCommandMessage,
} from "./types";
import * as AMQPL from "amqplib";
import simConfig from "./Config/simulation.json";
import { DEVICE_REGISTRATION_WITH_CLOUD, SENSOR_TO_CLOUD } from "./QueueNames";
import { getRandomItem, registerForQueue } from "./util";
export default class CloudServer {
  id!: string;
  static channel: AMQPL.Channel;
  static fogs: Set<Device> = new Set();
  static sensors: Set<Device> = new Set();
  constructor() {
    this.id = simConfig.peerJS.cloudServerName;
    this.onRegistrationRequestFromFogAndSensor.bind(
      this.onRegistrationRequestFromFogAndSensor
    );
  }

  async configure() {
    console.log("Starting config");
    const connection = await AMQPL.connect(simConfig.rabitmq.directConfig.url);
    CloudServer.channel = await connection.createChannel();
    await this.openChannelForFogsAndSensor();
    await this.openChannelForSensors();
  }

  async openChannelForSensors() {
    try {
      registerForQueue(
        CloudServer.channel,
        SENSOR_TO_CLOUD,
        this.onRegistrationRequestForSensor
      );
    } catch (error) {
      console.error(error);
    }
  }

  async openChannelForFogsAndSensor() {
    try {
      registerForQueue(
        CloudServer.channel,
        DEVICE_REGISTRATION_WITH_CLOUD,
        this.onRegistrationRequestFromFogAndSensor
      );
    } catch (error) {
      console.error(error);
    }
  }

  async onRegistrationRequestForSensor(msg: AMQPL.ConsumeMessage | null) {
    console.log("Message from Sensor for registration");
  }

  onRegistrationRequestFromFogAndSensor = (
    msg: AMQPL.ConsumeMessage | null
  ) => {
    console.log("Message from device");
    if (!msg) {
      console.log("Message from fog is null");
      return;
    }
    const content = msg.content.toString();
    const message: Device = JSON.parse(content);
    const device: Device = {
      deviceType: message.deviceType,
      community: undefined,
      id: message.id,
    };
    console.log(device);
    if (device.deviceType === DeviceType.FOG) {
      CloudServer.fogs.add(device);
      console.log("Registration of fog complete");
    } else {
      CloudServer.sensors.add(device);
      // assign a fog to sensor
      // find a random Fog node
      const randomFog = getRandomItem(CloudServer.fogs);
      const msg: FogAssignementToSensor = {
        id: randomFog.id,
      };
      CloudServer.channel.sendToQueue(
        device.id,
        Buffer.from(JSON.stringify(msg))
      );
      console.log("Registration of Sensor complete");
    }
  };
}
