import { MESSAGETYPE, PeerCommandMessage } from "./types";

import { v4 as uuidv4 } from "uuid";
import simConfig from "./Config/simulation.json";

export default class CloudServer {
  id!: string;
  channel: 
  constructor() {
    this.id = simConfig.peerJS.cloudServerName;
  }

  async configure(){

  }

  onNewConnection() {
    // conn.on("data", (data) => {
    //   console.log(data);
    //   const peerMessage: PeerCommandMessage = JSON.parse(data);
    //   switch (peerMessage.messageType) {
    //     case MESSAGETYPE.REGISTER_FOG_ID:
    //       console.debug("Registration was requested by FOG, saving in-memory");
    //       break;
    //     default:
    //       console.error("unhandled command ", peerMessage);
    //   }
    // });
  }
}
