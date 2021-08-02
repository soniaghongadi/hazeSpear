import CloudServer from "./CloudServer";
import simConfig from "./Config/simulation.json";
import FogServer from "./FogServer";
import startSignalServer from "./SignalServer";
// //read from config
// const fog = simConfig.fog;

// // start a cs instance
// let cs = new CloudServer();

// // create as many instances as listed in config
// let fogMapper = [];
// console.debug("Starting fog instances");
// for (let i = 0; i < fog.number; i++) {
//   fogMapper.push(new FogServer());
// }
// console.debug("Started fog instances");

startSignalServer();
