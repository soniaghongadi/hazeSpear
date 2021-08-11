import CloudServer from "./CloudServer";
import simConfig from "./Config/simulation.json";
import FogServer from "./FogServer";
import "source-map-support/register";

// //read from config
const fog = simConfig.fog;

// verify rabitmq connection

// // start a cs instance
let cs = new CloudServer();

async function startFogServer() {
  // create as many instances as listed in config
  let fogMapper = [];
  console.debug("Starting fog instances");
  for (let i = 0; i < fog.number; i++) {
    const fog = new FogServer();
    await fog.configure();
    fogMapper.push(new FogServer());
  }
  console.debug("Started fog instances");
}
startFogServer();
console.log("signaling server connected");
