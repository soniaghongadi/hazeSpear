const SimplePeerServer = require("simple-peer-server");
const SimplePeerWrapper = require("simple-peer-wrapper");
const http = require("http");

export function startSignalServer() {
  const server = http.createServer();
  server.listen(8081);
  const spServer = new SimplePeerServer(server);
}

export function startClient() {
  const options = {
    serverUrl: "http://localhost:8081",
  };
  const spw = new SimplePeerWrapper(options);
  spw.connect();
}
