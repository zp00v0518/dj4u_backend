import { IncomingMessage } from "node:http";
import http from "node:http";
import PostRequestHandle from "./PostRequestHandle.ts";

class Server {
  constructor() {
    this.postRequestHandle = new PostRequestHandle().getHandler();
  }

  init(port) {
    this.server = http.createServer();
    this.server.listen(port, () => {
      console.log(`Сервер запущен по адресу http://localhost:${port}`);
    });

    return this;
  }
  on(eventName, requestListener) {
    this.server.on(eventName, requestListener);
  }

  handleRequest(req: IncomingMessage, res) {
    this.handleCORS(req, res);

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }
    if (req.method === "GET") {
      return;
    }
    if (req.method === "POST") {
      this.postRequestHandle(req, res);
      return;
    }
  }

  handleCORS(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
}

export default Server;
