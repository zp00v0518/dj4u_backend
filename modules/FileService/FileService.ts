import fs from "node:fs/promises";
import path from "node:path";
import config from "../../config/config.ts";
import formidable, { errors as formidableErrors } from "formidable";
import { IncomingMessage } from "node:http";

class FileService {
  async createDirectoryForUser(userId: string) {
    const userDir = path.join(config.files.uploadDir, userId);
    try {
      await fs.access(userDir, fs.constants.X_OK);
      return userDir;
    } catch (err) {
      if (err.code === "ENOENT") {
        await fs.mkdir(userDir, { recursive: true });
        return userDir;
      }
      console.log(err);
      return false;
    }
  }

  async saveFilesToFileSystem(req: IncomingMessage, pathToFolder: string) {
    const options = {
      uploadDir: pathToFolder,
      filename: (name, ext, part, form) => {
        const { originalFilename } = part;
        return `${Date.now()}_${originalFilename}`;
      },
    };
    const form = formidable(options);
    try {
      const [fields, files] = await form.parse(req);
      if (files.length < 2) return;
      return {
        fields,
        files: files.files
      };
    } catch (err) {
      console.log(err);
      return;
    }
  }
}

export default new FileService();
