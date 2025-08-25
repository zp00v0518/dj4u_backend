import path from "path";
import url from "url";
import RequestHandle from "./RequestHandle.ts";
import Cookies from "cookies";

class GetRequestHandle extends RequestHandle {
  async requestHandle(req: any, res: any) {
    let urlParse = url.parse(req.url, true);
    let pathUrl = urlParse.path;
    const contentFolder = "./dist";
    const pathJoin = path.join(contentFolder, pathUrl);
    const ext = path.parse(pathUrl).ext;
    if (pathUrl === "/") {
      const data = await this.fileReader(path.join(pathJoin, "index.html"));
      if (!data) {
        this.notFoundRequest(res);
        return;
      }
      // const cookies = new Cookies(req, res);
      // cookies.set("token", Math.random().toString(), { maxAge: 1000 * 60 * 60 * 24, httpOnly: false });
      this.sendResponse(res, data, "text/html");
    } else if (!ext) {
      this.notFoundRequest(res);
    } else {
      const data = await this.fileReader(pathJoin);
      if (!data) {
        this.notFoundRequest(res);
        return;
      }
      this.sendResponse(res, data, this.mimeTypes[ext], 200);
    }
  }

  notFoundRequest(res) {
    this.sendResponse(res, "<h1>404 Not Found</h1>", "text/html", 404);
  }
}

export default GetRequestHandle;
