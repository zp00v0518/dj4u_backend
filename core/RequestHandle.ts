import { readFile } from "node:fs/promises";
import fs from "node:fs";
import { pipeline } from "node:stream/promises";
import checkSchema from "../utils/checkSchema.ts";
import Cookies from "cookies";

class RequestHandle {
  constructor() {
    this.mimeTypes = {
      ".js": "text/javascript",
      ".css": "text/css",
      ".jpg": "image/jpeg",
      ".bmp": "image/bmp",
      ".png": "image/png",
      ".json": "application/json",
      ".ico": "image/x-icon",
      ".html": "text/html",
      ".manifest": "text/cache-manifest",
    };
  }
  sendResponse(
    res: any,
    data: any = null,
    contentType: string = "text/plain",
    statusCode: number = 200
  ) {
    if (res.writableEnded) {
      console.log("Response already ended. Aborting sendResponse.");
      return;
    }
    res.writeHead(statusCode, { "Content-Type": contentType });
    const responseData =
      typeof data === "object" && contentType === "application/json"
        ? JSON.stringify(data)
        : data;

    res.end(responseData);
  }

  requestHandle(req: any, res: any) {
    console.log("requestHandle -  method not implemented");
  }

  getHandler() {
    return this.requestHandle.bind(this);
  }

  async fileReader(filePath) {
    try {
      const contents = await readFile(filePath);
      return contents;
    } catch (err) {
      console.error(err.message);
      return null;
    }
  }

  reqOn(req, callback = function (a) {}) {
    return new Promise((resolve, reject) => {
      try {
        let data = "";
        req.on("data", (chunk) => {
          data += chunk;
        });
        req.on("end", () => {
          resolve(data);
          return callback(data);
        });
      } catch (error) {
        reject(null);
        return callback(null);
      }
    });
  }

  checkSchema(target = {}, schema = {}) {
    return checkSchema(target, schema);
  }

  sendBadRequest(res, message = "Bad Request") {
    this.sendResponse(res, message, "text/plain", 400);
  }

  getCookies(req, res, cookiesName) {
    const cookies = new Cookies(req, res);
    return cookies.get(cookiesName);
  }
}

export default RequestHandle;
