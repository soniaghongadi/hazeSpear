import moment from "moment";
import { v4 as uuidv4 } from "uuid";
import * as AMQPL from "amqplib";
import {
    COMMANDS,
    Device,
    DeviceType,
    IoTDevice,
    IoTMessage,
    MESSAGETYPE,
    PeerCommandMessage,
} from "./types";
import simConfig from "./Config/simulation.json";
import { DEVICE_REGISTRATION_WITH_CLOUD } from "./QueueNames";
import {
    getQueueForDataSync,
    getQueueForFogApp,
    getRandomArbitrary,
    getRandomInt,
    registerForQueue,
} from "./util";
import {
    MonitorDataProvider,
    SensorDataProvider,
    SimpleApp,
    SimpleFogAppType,
} from "./simpleApp";
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const csvWriter = createCsvWriter({
    path: "results/" + moment(new Date()).format("YYYY-MM-DD-H-M-SS") + ".csv",
    header: [
        { id: "counter", title: "counter" },
        { id: "timeTaken", title: "timetaken" },
    ],
});
export default class FogServer {
    id: string = "";
    ioTDevices: Map<string, Array<IoTMessage>> = new Map();
    cloudServerId = "";
    channel!: AMQPL.Channel;
    queueToIoT: any;
    communityId!: string;
    app!: SimpleFogAppType;
    startedDataSync: boolean = false;
    isManager: boolean = false;
    simpleApp: SimpleApp = new SimpleApp();
    constructor() {
        //generate unique id for fog servers
        this.id = uuidv4();
        console.log(this.id);
    }

    async configure() {
        //create unique channel for fog so IoT sensors can send the data
        // receive data from IoTSensor
        const connection = await AMQPL.connect(
            simConfig.rabitmq.directConfig.url
        );
        this.channel = await connection.createChannel();
        await this.openChanelForSensors();
        await this.openChannelForAppSync();
        // let the Cloud server know that we are alive and channel is set
        await this.registerIdToCloudServer();
        await this.onCommunityFormation();
    }
    // cloud will ask us to participate in community
    async onCommunityFormation() {
        try {
            const commandQueue = getQueueForDataSync(this.id);
            registerForQueue(
                this.channel,
                commandQueue,
                (msg: AMQPL.ConsumeMessage | null) => {
                    if (msg) {
                        this.communityId = JSON.parse(msg.content.toString());
                        //once community id is available make sure to start a sync with it
                        // by sending out whatever sensor data we have to other fogs
                        console.log(
                            "Requested community participation from cloud with commId",
                            this.communityId
                        );
                        this.startSyncListnerAndSendorForCommunity();
                    }
                }
            );
        } catch (error) {
            console.error(error);
        }
    }
    sendDataToCommunity(val: IoTMessage) {
        // open channel to community and send whatever data I have till date
        // and will keep on sending new one later
        this.channel.sendToQueue(
            this.communityId,
            Buffer.from(JSON.stringify(val))
        );
    }
    async startSyncListnerAndSendorForCommunity() {
        if (this.communityId) {
            if (!this.startedDataSync) {
                this.startedDataSync = true;
                console.log("Starting sync up with comminiy", this.communityId);
                //send existing data
                this.ioTDevices.forEach((value) => {
                    value.forEach((val) => {
                        this.sendDataToCommunity(val);
                    });
                });
            } else {
                console.log("Already started community sync");
            }
        } else {
            console.log("I don't have community Id yet, I am Manager!");
        }
        if (this.app && this.communityId) {
            this.startAppExecution();
        } else {
            console.log("Seems like I am a participating node");
        }
        // now we start app execution
    }

    async startAppExecution() {
        //make sure our community manager listerns have started on community Id channel
        const okConnection = await this.channel.assertQueue(this.communityId);
        this.channel.consume(this.communityId, (message) => {
            if (!message) {
                console.log("Syncup message is null");
                return;
            }
            // send data in IoTMessage Format
            const iOtMessage: IoTMessage = JSON.parse(
                message.content.toString()
            );
            this.saveLocally(iOtMessage);
        });
        console.log(
            `Starting app execution with app: ${this.app}, communityId:${this.communityId}`
        );
        this.runApp();
    }

    runApp = async () => {
        const delay = (timeInMilliSec = simConfig.fog.waitForCommunitySync) => {
            return new Promise((res, rej) => {
                setTimeout(res, timeInMilliSec);
            });
        };
        let missedData = 0;
        const getSensorData: SensorDataProvider = async (
            sensorId: string,
            counter: number
        ): Promise<IoTMessage> => {
            if (simConfig.formCommunity) {
                // see if data is available or wait for 20 millisecond
                // wait upto 2 seconds before fetching data from community
                for (let i = 0; i < simConfig.fog.retriesBeforeFail; i++) {
                    if (this.ioTDevices.has(sensorId)) {
                        const deviceMessages = this.ioTDevices.get(sensorId);
                        const message = deviceMessages?.find(
                            (element) => element.counter === counter
                        );
                        if (message) return message;
                    } else {
                        await delay();
                    }
                }
                missedData += 1;
            }
            // simulates delay to fetch data from cloud
            // below limits are taken from 100 to 200 milliseconds
            // while 100 seconds is on extreme low end
            const realTimeDelya = getRandomInt(
                simConfig.fog.internetDelayLimit.lowerBound,
                simConfig.fog.internetDelayLimit.upperBound
            );
            await delay(realTimeDelya);
            const { lowestLimit, highestLimit } =
                simConfig.sensor.tempratureGeneration;
            const simulatedMessage: IoTMessage = {
                counter: counter,
                deviceId: sensorId,
                value: getRandomArbitrary(lowestLimit, highestLimit),
                timestamp: "",
            };
            return simulatedMessage;
            // if its a community simply get it from local storage
        };
        const sendDataToMonitor: MonitorDataProvider = async (
            counter: number,
            timeTaken: number
        ) => {
            console.warn(`Counter:${counter},timeTaken: ${timeTaken}`);
            // dump data to csv file
            await csvWriter.writeRecords([{ counter, timeTaken }]);
        };
        await this.simpleApp.executableAlgorithm(
            this.app,
            getSensorData,
            sendDataToMonitor
        );
        console.log("missed datapoints in community", missedData);
        this.app.counter += 1;
        //re run everything once each tick is complete
        setTimeout(this.runApp, this.app.delayBeteenTime * 1000);
    };

    // form and start sync with community participants
    // create a onCommunityFormationRequest and sync in data from others with manager
    // fog will start sending out the data as soon as it detects anything incoming from governing sensor
    // community is to be formed where we will publish message to queue and everyone is supposed to consume the same message
    // this happens in fanout mode
    async openChannelForAppSync() {
        try {
            const appQueue = getQueueForFogApp(this.id);
            const okConnection = await this.channel.assertQueue(appQueue);
            this.channel.consume(appQueue, (message) => {
                if (!message) {
                    return;
                }
                this.app = JSON.parse(message.content.toString());
                console.log(
                    `Governing fog node is ${this.communityId}, downloaded app executable is ${this.app}`
                );
                //attempt to start syncup
                this.startSyncListnerAndSendorForCommunity();
            });
        } catch (error) {
            console.error(error);
        }
    }

    async registerIdToCloudServer() {
        const thisDevice: Device = {
            id: this.id,
            deviceType: DeviceType.FOG,
        };
        this.channel.sendToQueue(
            DEVICE_REGISTRATION_WITH_CLOUD,
            Buffer.from(JSON.stringify(thisDevice))
        );
    }

    async openChanelForSensors() {
        try {
            const okConnection = await this.channel.assertQueue(this.id);
            this.channel.consume(this.id, this.onMessageReceivedFromIoTDevice);
        } catch (error) {
            console.error(error);
        }
    }

    onMessageReceivedFromIoTDevice = (message: AMQPL.ConsumeMessage | null) => {
        // lets retain data from IoT device
        if (!message) {
            return;
        }
        const iOTMessage: IoTMessage = JSON.parse(message.content.toString());
        this.saveLocally(iOTMessage);
        // also send the fresh data to community
        if (this.startedDataSync) {
            this.sendDataToCommunity(iOTMessage);
        }
    };

    saveLocally(iOTMessage: IoTMessage) {
        // push the message to relavent queue and make sure to follow retention policy
        const currentQueue = this.ioTDevices.get(iOTMessage.deviceId) || [];
        const msgs = currentQueue.push(iOTMessage);
        if (
            simConfig.fog.retention &&
            currentQueue.length > simConfig.fog.perDeviceMessageRetentionSize
        ) {
            const msgsToDelete =
                currentQueue.length -
                simConfig.fog.perDeviceMessageRetentionSize;
            currentQueue.splice(0, msgsToDelete);
        }
        this.ioTDevices.set(iOTMessage.deviceId, currentQueue);
    }
}
