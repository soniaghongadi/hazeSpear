import * as AMQPL from "amqplib";
import { v4 as uuidv4 } from "uuid";
import { configure } from "winston";
import { DEVICE_REGISTRATION_WITH_CLOUD, SENSOR_TO_CLOUD } from "./QueueNames";
import { registerForQueue, getRandomArbitrary } from "./util";
import simConfig from "./Config/simulation.json";
import {
    Device,
    DeviceType,
    FogAssignementToSensor,
    IoTMessage,
} from "./types";

export default class Sensor {
    id!: string;
    channel!: AMQPL.Channel;
    fogServer!: string;

    constructor() {
        // connect to cloud server and get the assigned Fog server
        this.id = uuidv4();
    }

    async configure() {
        const connection = await AMQPL.connect(
            simConfig.rabitmq.directConfig.url
        );
        this.channel = await connection.createChannel();
        await this.registerToCloud();
        this.openChannelWithCloud();
        //this.sendDataToFog();
    }

    async registerToCloud() {
        const thisDevice: Device = {
            id: this.id,
            deviceType: DeviceType.SENSOR,
        };
        this.channel.sendToQueue(
            DEVICE_REGISTRATION_WITH_CLOUD,
            Buffer.from(JSON.stringify(thisDevice))
        );
    }

    openChannelWithCloud() {
        registerForQueue(this.channel, this.id, this.onMessageFromCloud);
    }

    onMessageFromCloud = (msg: AMQPL.ConsumeMessage | null) => {
        if (!msg) {
            return;
        }
        const message: FogAssignementToSensor = JSON.parse(
            msg.content.toString()
        );
        this.fogServer = message.id;
        // this will start sending data to relavent fog
        this.startDataSenderToFog();
    };

    startDataSenderToFog() {
        let value = 1;
        this.channel.sendToQueue(
            this.fogServer,
            Buffer.from(JSON.stringify(dataGenerator(this.id, value)))
        );
        setInterval(() => {
            value += 1;
            const generatedData = dataGenerator(this.id, value);
            this.channel.sendToQueue(
                this.fogServer,
                Buffer.from(JSON.stringify(generatedData))
            );
        }, simConfig.sensor.delayBetweenSensorAwakeInSeconds * 1000);
    }
}

function dataGenerator(deviceId: string, counter: number): IoTMessage {
    // generate a random sensor data
    const { lowestLimit, highestLimit } = simConfig.sensor.tempratureGeneration;
    const msg: IoTMessage = {
        deviceId,
        timestamp: Date.now().toString(),
        value: getRandomArbitrary(lowestLimit, highestLimit),
        counter,
    };
    return msg;
}
