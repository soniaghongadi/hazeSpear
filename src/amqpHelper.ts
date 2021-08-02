import ampqp from "amqplib/callback_api";
import simConfig from "./Config/simulation.json";
import { IoTMessage } from "./types";
import Broker, { BrokerAsPromised } from "rascal";

export default class AMQPHelper {
  static broker: BrokerAsPromised;
  static _instance: any;

  private constructor() {}

  static async configure() {
    try {
      this.broker = await Broker.BrokerAsPromised.create(
        Broker.withDefaultConfig(simConfig.rabitmq.rascalConfig)
      );
      this.broker.on("error", console.error);
    } catch (error) {
      console.error(error);
    }
  }

  static async getInstance(): Promise<AMQPHelper> {
    if (!this._instance) {
      this._instance = new AMQPHelper();
      await this.configure();
    }
    return this._instance;
  }

  async sendIoTMessageToFog(fogName: string, message: IoTMessage) {
    const publication = await AMQPHelper.broker.publish(
      fogName,
      JSON.stringify(message)
    );
    publication.on("error", console.error);
  }

  async registerFogToServer(fogQueue: string, cloudServerName: string) {
    const publication = await AMQPHelper.broker.publish(
      cloudServerName,
      fogQueue
    );
    publication.on("error", console.error);
  }

  getBroker() {
    return AMQPHelper.broker;
  }
}
