import RequestHandle from "./RequestHandle.ts";
import handlerList from "./handlerList.ts";
import tryJsonParse from "../utils/tryJsonParse.ts";

class PostRequestHandle extends RequestHandle {
  requestHandle(req: any, res: any) {
    const url = req.url;
    const method = req.method;
    const apiUrl = "/api";

    if (method === "POST" && url.includes(apiUrl)) {
      const key = url.replace(apiUrl, "");
      const handler = handlerList[key];
      if (!handler) {
        this.sendResponse(res, "<h1>Method Not Allowed</h1>", "text/html", 404);
        return;
      }
      this.reqOn(req, (data) => {
        const parsedData = data ? tryJsonParse(data) : null;
        try {
          handler(parsedData, req, res);
        } catch (error) {
          this.sendResponse(
            res,
            "<h1>reqOn Not Allowed</h1>",
            "text/html",
            405
          );
        }
      });
    } else {
      this.sendResponse(res, "<h1>Method Not Allowed</h1>", "text/html", 405);
    }
  }
}

export default PostRequestHandle;
