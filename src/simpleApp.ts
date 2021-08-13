import moment from "moment";
import { IoTMessage } from "./types";
export enum SensorUsageType {
    RANDOM, //calculates sensor needed at runtime
    SPECIFIED, //expected by application developer to provide
}

export enum FogServerAssignmentType {
    RANDOM,
    SPECIFIED,
}

export type MonitorDataProvider = (counter: number, timeTaken: number) => void;

export type SensorDataProvider = (
    sensorId: string,
    counter: number
) => Promise<IoTMessage>;

export type SimpleFogAppType = {
    SensorUsageType: SensorUsageType;
    SensorIds: Array<string>;
    sensorSize: number;
    delayBeteenTime: number;
    assignedFogServerType: FogServerAssignmentType;
    participatingFogs: Array<string>;
    counter: number;
    communityId: string;
};

export const SimpleAppData: SimpleFogAppType = {
    assignedFogServerType: FogServerAssignmentType.RANDOM,
    SensorUsageType: SensorUsageType.RANDOM,
    sensorSize: 5, // must be less than what is there in simConfig
    SensorIds: [],
    participatingFogs: [],
    delayBeteenTime: 30 * 1000,
    counter: 0,
    communityId: "",
};

export class SimpleApp {
    // Should be executed by the fog Server on every {@link delayBetweenTime}
    async executableAlgorithm(
        data: SimpleFogAppType,
        getSensorData: SensorDataProvider,
        sendDataToMonitor: MonitorDataProvider
    ) {
        // this algorithm will simply calculate average temprature from sensor every 5 min on edge
        let totalSensorValue = 0;
        const starTime = moment(new Date());
        const size = data.SensorIds.length;
        for (let i = 0; i < size; i++) {
            // sum of all temprature value
            const val = (await getSensorData(data.SensorIds[i], data.counter))
                .value;
            if (val) totalSensorValue += val;
            // wait and attempt to get it again in 20 millisecond
        }
        const secondsPassed = moment().diff(starTime, "milliseconds");
        const averagedValue = totalSensorValue / size;
        console.log(
            `For counter: ${data.counter}, took: ${secondsPassed} milliseconds, for Fogsize: ${size} with average temp value:${averagedValue}`
        );
        sendDataToMonitor(data.counter, secondsPassed);
    }
}
