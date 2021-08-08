const SimplePeerServer = require("simple-peer-server");
const http = require("http");
function startSignlaingServer() {
  const server = http.createServer();
  const spServer = new SimplePeerServer(server, true);
  server.listen(8081);
}
startSignlaingServer();
