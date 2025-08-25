import Server from "./core/Server.ts";
import config from './config/config.ts'

async function init() {
  const server = new Server();

  server.init(config.server.port).on("request", (res, req) => {
    server.handleRequest(res, req);
  });
};

init()
