import * as AMQPL from "amqplib";
import { Device } from "./types";

interface myCallbackType {
	(msg: AMQPL.ConsumeMessage | null): void;
}

export async function registerForQueue(
	channel: AMQPL.Channel,
	queueName: string,
	callBack: myCallbackType
) {
	try {
		const okConnection = await channel.assertQueue(queueName);
		channel.consume(queueName, callBack);
	} catch (error) {
		console.error(error);
	}
}

export function getRandomItem(set: Set<Device>): Device {
	let items = Array.from(set);
	return items[Math.floor(Math.random() * items.length)];
}
