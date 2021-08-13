import * as AMQPL from "amqplib";
import { COMMANDS, Device } from "./types";

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
        channel.consume(queueName, callBack, { noAck: true });
    } catch (error) {
        console.error(error);
    }
}

export function getRandomItem(set: Set<Device>): Device {
    let items = Array.from(set);
    return items[Math.floor(Math.random() * items.length)];
}

export function getQueueForFogApp(fogId: string): string {
    return `APPSTARTER_${fogId}`;
}

export function getQueueForDataSync(fogId: string): string {
    return `${COMMANDS.FORM_COMMUNITY}_${fogId}`;
}

const times = (x: number) => (f: () => void) => {
    if (x > 0) {
        f();
        times(x - 1)(f);
    }
};

//consider our sensors are of type temprature and lets generate one
export function getRandomArbitrary(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

export function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
