import Peer from "peerjs";
import { v4 as uuidv4 } from "uuid";
import AMQPHelper from "./amqpHelper";
import {
  IoTDevice,
  IoTMessage,
  MESSAGETYPE,
  PeerCommandMessage,
} from "./types";
import simConfig from "./Config/simulation.json";
export default class FogServer {
  id: string = "";
  ioTDevices: Array<IoTDevice> = [];
  cloudServerId = "";
  peer: Peer;
  constructor() {
    //generate unique id for fog servers
    this.id = uuidv4();
    //create unique channel for fog so IoT sensors can send the data
    // receive data from IoTSensor
    this.openChanelForSensors();
    // let the Cloud server know that we are alive and channel is set
    const { host, port, path } = simConfig.peerJS;
    this.peer = new Peer(this.id, { host, port, path });
    this.registerIdToCloudServer();
  }

  registerIdToCloudServer() {
    const conn = this.peer.connect(simConfig.peerJS.cloudServerName);
    conn.on("open", () => {
      const peerCommandMessage = <PeerCommandMessage>{
        message: {},
        messageType: MESSAGETYPE.REGISTER_FOG_ID,
      };
      conn.send(JSON.stringify(peerCommandMessage));
    });
  }

  async openChanelForSensors() {
    try {
      const amqpInstance: AMQPHelper = await AMQPHelper.getInstance();
      const subscription = await amqpInstance.getBroker().subscribe(this.id);
      subscription
        .on("message", (message, content, ackOrNack) => {
          console.log(content);
          this.onMessageReceivedFromIoTDevice(JSON.parse(content));
          ackOrNack();
        })
        .on("error", console.error);
    } catch (error) {
      console.error(error);
    }
  }

  onMessageReceivedFromIoTDevice(message: IoTMessage) {
    console.log(message);
  }
}
