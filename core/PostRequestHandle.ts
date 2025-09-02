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
      const contentType = req.headers["content-type"];
      if (
        contentType &&
        (contentType.includes("multipart/form-data") ||
          contentType.includes("application/x-www-form-urlencoded"))
      ) {
        handler(req, res);
      } else {
        this.reqOn(req, (data) => {
          let parsedData = data;
          parsedData = data ? tryJsonParse(data) : null;

          try {
            handler(req, res, parsedData);
          } catch (error) {
            this.sendResponse(
              res,
              "<h1>reqOn Not Allowed</h1>",
              "text/html",
              405
            );
          }
        });
      }
    } else {
      this.sendResponse(res, "<h1>Method Not Allowed</h1>", "text/html", 405);
    }
  }
}

export default PostRequestHandle;
