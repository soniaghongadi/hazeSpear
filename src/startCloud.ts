import { SimpleAppData } from "./simpleApp";
import { startCloudServer, startFogServer } from "./starterHelper";
async function sCloud() {
    const cs = await startCloudServer();
    await startFogServer();
    setTimeout(() => {
        cs.formCommunityForApp(SimpleAppData);
    }, 2000);
}

sCloud();
