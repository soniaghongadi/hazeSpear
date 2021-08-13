import { SimpleAppData } from "./simpleApp";
import {
    startCloudServer,
    startFogServer,
    startSensors,
} from "./starterHelper";

export async function startup() {
    const cs = await startCloudServer();
    await startFogServer();
    await startSensors();
    // create a new app
    cs.formCommunityForApp(SimpleAppData);
}

startup();
