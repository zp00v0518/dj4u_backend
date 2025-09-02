import fs from "node:fs/promises";
import path from "node:path";
import config from "../../config/config.ts";

class FileService {
  async createDirectoryForUser(userId) {
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
}

export default new FileService();
