import { v4 as uuidv4 } from "uuid";
import * as AMQPL from "amqplib";
import {
	Device,
	DeviceType,
	IoTDevice,
	IoTMessage,
	MESSAGETYPE,
	PeerCommandMessage,
} from "./types";
import simConfig from "./Config/simulation.json";
import { DEVICE_REGISTRATION_WITH_CLOUD } from "./QueueNames";
export default class FogServer {
	id: string = "";
	ioTDevices: Array<IoTDevice> = [];
	cloudServerId = "";
	channel!: AMQPL.Channel;
	queueToIoT: any;
	constructor() {
		//generate unique id for fog servers
		this.id = uuidv4();
	}

	async configure() {
		//create unique channel for fog so IoT sensors can send the data
		// receive data from IoTSensor
		const connection = await AMQPL.connect(
			simConfig.rabitmq.directConfig.url
		);
		this.channel = await connection.createChannel();
		this.openChanelForSensors();
		// let the Cloud server know that we are alive and channel is set
		await this.registerIdToCloudServer();
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

	onMessageReceivedFromIoTDevice(message: any) {
		console.log(message);
	}
}
