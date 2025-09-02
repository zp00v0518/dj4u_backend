import RequestHandle from "../../core/RequestHandle.ts";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { IncomingMessage } from "node:http";
import formidable, { errors as formidableErrors } from "formidable";
import UserHandler from "../../modules/User/UserHandler.ts";
import FileService from "../FileService/FileService.ts";

class MixHandler extends RequestHandle {
  async handleMultipartUpload(req: IncomingMessage, res: any) {
    const contentType = req.headers["content-type"];
    if (!contentType || !contentType.startsWith("multipart/form-data")) {
      this.sendResponse(res, "Невірний Content-Type.", "text/plain", 400);
      return;
    }

    const boundary = `--${contentType.split("boundary=")[1]}`;
    let body: Buffer[] = [];
    let fileWritten = false;

    req.on("data", (chunk: Buffer) => {
      body.push(chunk);
    });

    req.on("end", async () => {
      console.log(123);
      const fullBody = Buffer.concat(body);
      const parts = fullBody.toString().split(boundary);

      for (const part of parts) {
        if (!part.includes("Content-Disposition")) continue;

        const headers = part.split("\r\n\r\n")[0];
        const fileContent = part.split("\r\n\r\n")[1];

        const filenameMatch = headers.match(/filename="([^"]+)"/);
        const mimeTypeMatch = headers.match(/Content-Type: ([^;]+)/);
        console.log(headers, filenameMatch, mimeTypeMatch);

        if (filenameMatch && mimeTypeMatch) {
          const filename = filenameMatch[1];
          const mimeType = mimeTypeMatch[1].trim();

          if (!mimeType.startsWith("audio/")) {
            console.log("Невірний тип файлу. Дозволені лише аудіофайли.");
            this.sendResponse(
              res,
              "Невірний тип файлу. Дозволені лише аудіо.",
              "text/plain",
              400
            );
            return;
          }

          console.log(`Завантаження файлу: ${filename}, Тип: ${mimeType}`);

          const fileData = Buffer.from(fileContent, "binary");
          const finalData = fileData.slice(0, fileData.lastIndexOf("--"));

          const saveTo = path.join(
            __dirname,
            "..",
            "..",
            "..",
            "temp",
            filename
          );
          const writeStream = createWriteStream(saveTo);

          writeStream.write(finalData);
          writeStream.end();
          fileWritten = true;

          writeStream.on("close", () => {
            console.log(`Файл ${filename} успішно збережено.`);
            this.sendResponse(
              res,
              { status: true, data: { filename, path: saveTo } },
              "application/json",
              200
            );
          });

          writeStream.on("error", (err) => {
            console.error(`Помилка запису файлу: ${err.message}`);
            this.sendResponse(
              res,
              "Помилка сервера при завантаженні файлу",
              "text/plain",
              500
            );
          });

          return;
        }
      }

      if (!fileWritten) {
        this.sendResponse(
          res,
          "Не знайдено файл для завантаження.",
          "text/plain",
          400
        );
      }
    });

    req.on("error", (err) => {
      console.error("Помилка при читанні запиту:", err.message);
      this.sendResponse(res, "Помилка при обробці запиту", "text/plain", 400);
    });
  }

  async uploadFileFromUser(req: any, res: any) {
    const userProfile = await UserHandler.getUserProfileByCookie(req, res);
    if (!userProfile) {
      this.sendBadRequest(res);
      return;
    }
    const userFolder = await FileService.createDirectoryForUser(
      userProfile._id.toString()
    );
    const options = {
      uploadDir: userFolder,
      filename: (name, ext, part, form) => {
        const { originalFilename } = part;
        return originalFilename;
      },
    };
    const form = formidable(options);
    try {
      const [fields, files] = await form.parse(req);
      console.log(fields, files);
    } catch (err) {
      console.log(err);
      // if (err.code === formidableErrors.maxFieldsExceeded) {
      // }
      this.sendBadRequest(res);
      return;
    }
  }
}

export default new MixHandler();
