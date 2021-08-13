import { v4 as uuidv4 } from "uuid";

import {
    FogServerAssignmentType,
    SensorUsageType,
    SimpleApp,
    SimpleFogAppType,
} from "./simpleApp";
import {
    COMMANDS,
    Device,
    DeviceType,
    FogAssignementToSensor,
    MESSAGETYPE,
    PeerCommandMessage,
    SensorDevice,
} from "./types";
import * as AMQPL from "amqplib";
import simConfig from "./Config/simulation.json";
import { DEVICE_REGISTRATION_WITH_CLOUD, SENSOR_TO_CLOUD } from "./QueueNames";
import {
    getQueueForDataSync,
    getQueueForFogApp,
    getRandomItem,
    registerForQueue,
} from "./util";
var _ = require("lodash");

export default class CloudServer {
    id!: string;
    static channel: AMQPL.Channel;
    static fogs: Set<Device> = new Set();
    static sensors: Set<SensorDevice> = new Set();
    constructor() {
        this.id = simConfig.peerJS.cloudServerName;
        this.onRegistrationRequestFromFogAndSensor.bind(
            this.onRegistrationRequestFromFogAndSensor
        );
    }

    async configure() {
        console.log("Starting config");
        const connection = await AMQPL.connect(
            simConfig.rabitmq.directConfig.url
        );
        CloudServer.channel = await connection.createChannel();
        await this.openChannelForFogsAndSensor();
    }

    // to be used by external API that starts community formation upon request is complete
    //
    async formCommunityForApp(app: SimpleFogAppType) {
        // get list of sensor ids
        const sensorIds: Array<string> = [];
        const participatingFog: Set<string> = new Set();
        CloudServer.sensors.forEach((sensor) => {
            sensorIds.push(sensor.id);
            participatingFog.add(sensor.governingFog);
        });
        // prepare registered sensors
        if (app.SensorUsageType === SensorUsageType.RANDOM) {
            console.log("Taking random sensor for community formation");
            const sampleSensorIds = _.sampleSize(sensorIds, app.sensorSize);
            app.SensorIds = sampleSensorIds;
        }
        // find a randomly assigned fog out of participating fog for best community formation
        // and notify the fog to start the execution
        if (app.assignedFogServerType === FogServerAssignmentType.RANDOM) {
            const pFogArray = Array.from(participatingFog);
            app.participatingFogs = pFogArray;
            const electedFog = _.sample(pFogArray);
            //form a community
            const communityId = uuidv4();
            app.communityId = communityId;
            // notifing the fog to start the execution of app
            console.log(
                `Forming community with fogParticipants:${participatingFog.size}, sensorSize: ${app.SensorIds}`
            );
            CloudServer.channel.sendToQueue(
                getQueueForFogApp(electedFog),
                Buffer.from(JSON.stringify(app))
            );
            participatingFog.forEach((fogId) => {
                CloudServer.channel.sendToQueue(
                    getQueueForDataSync(fogId),
                    Buffer.from(JSON.stringify(communityId))
                );
            });
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
        if (device.deviceType === DeviceType.FOG) {
            CloudServer.fogs.add(device);
            console.log("Registration of fog complete");
        } else {
            const { id, deviceType, community } = device;
            // assign a fog to sensor
            // find a random Fog node
            const randomFog = getRandomItem(CloudServer.fogs);
            const msg: FogAssignementToSensor = {
                id: randomFog.id,
            };
            const sensor: SensorDevice = {
                id,
                deviceType,
                community,
                governingFog: randomFog.id,
            };
            CloudServer.sensors.add(sensor);
            CloudServer.channel.sendToQueue(
                device.id,
                Buffer.from(JSON.stringify(msg))
            );
            console.log("Registration of Sensor complete");
        }
    };
}
