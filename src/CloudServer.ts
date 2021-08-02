import { MESSAGETYPE, PeerCommandMessage } from "./types";
import { PeerServer } from "peer";
import Peer from "peerjs";
import { v4 as uuidv4 } from "uuid";
import simConfig from "./Config/simulation.json";

const peerJs = require('peerjs-nodejs');

export default class CloudServer {
  id!: string;
  peer: Peer;

  constructor() {
    this.id = simConfig.peerJS.cloudServerName;
    // Setup peer server
    const { host, port, path } = simConfig.peerJS;
    console.debug("Starting peer service");
    const peerServer = PeerServer({ port, path });
    console.debug(`Started peer service at localhost:${port}${path}`);

    //spawn client peer for server as well
    this.peer = new Peer(this.id, { host, port, path });
    this.peer.on("connection", this.onNewConnection);
  }

  onNewConnection(conn: Peer.DataConnection) {
    conn.on("data", (data) => {
      console.log(data);
      const peerMessage: PeerCommandMessage = JSON.parse(data);
      switch (peerMessage.messageType) {
        case MESSAGETYPE.REGISTER_FOG_ID:
          console.debug("Registration was requested by FOG, saving in-memory");
          break;
        default:
          console.error("unhandled command ", peerMessage);
      }
    });
  }
}
