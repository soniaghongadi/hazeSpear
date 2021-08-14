import CloudServer from "./CloudServer";
import simConfig from "./Config/simulation.json";
import FogServer from "./FogServer";
import "source-map-support/register";
import Sensor from "./Sensor";

// //read from config
const fog = simConfig.fog;
const sensor = simConfig.sensor;
const simulation = simConfig.simulation;

export async function startCloudServer() {
    console.log("Starting cloud server");
    const cs = new CloudServer();
    await cs.configure();
    console.log("Started cloud server");
    return cs;
}

export async function startFogServer() {
    // create as many instances as listed in config
    let fogMapper = [];
    console.debug("Starting fog instances");
    for (let i = 0; i < simulation.numberOfFogNode; i++) {
        const fog = new FogServer();
        await fog.configure();
        fogMapper.push(fog);
    }
    console.debug("Started fog instances");
}

export async function startSensors() {
    let sensorMapper = [];
    console.debug("Starting sensor instances");
    for (let i = 0; i < simulation.numberOfSensorNode; i++) {
        const sensor = new Sensor();
        await sensor.configure();
        sensorMapper.push(sensor);
    }
}
