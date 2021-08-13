import { SimpleAppData } from "./simpleApp";
import { startCloudServer } from "./starterHelper";
async function sCloud() {
    const cs = await startCloudServer();
    cs.formCommunityForApp(SimpleAppData);
}

sCloud();
