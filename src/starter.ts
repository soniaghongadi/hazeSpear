import CloudServer from "./CloudServer";
import simConfig from "./Config/simulation.json";
import FogServer from "./FogServer";
import "source-map-support/register";
import Sensor from "./Sensor";

// //read from config
const fog = simConfig.fog;
const sensor = simConfig.sensor;

// verify rabitmq connection

async function startCloudServer() {
  console.log("Starting cloud server");
  let cs = new CloudServer();
  await cs.configure();
  console.log("Started cloud server");
}

async function startFogServer() {
  // create as many instances as listed in config
  let fogMapper = [];
  console.debug("Starting fog instances");
  for (let i = 0; i < fog.number; i++) {
    const fog = new FogServer();
    await fog.configure();
    fogMapper.push(fog);
  }
  console.debug("Started fog instances");
}

async function startSensors() {
  let sensorMapper = [];
  console.debug("Starting fog instances");
  for (let i = 0; i < sensor.number; i++) {
    const sensor = new Sensor();
    await sensor.configure();
    sensorMapper.push(sensor);
  }
}

async function startup() {
  await startCloudServer();
  await startFogServer();
  await startSensors();
}

startup();
