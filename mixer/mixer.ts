import { exec } from "node:child_process";
import { promisify } from "node:util";

import path from "node:path";
import config from "../config/config.ts";

const execPromise = promisify(exec);

class Mixer {
  async executeCommand(userID, filesName) {
    const filesPath = filesName.map((name) => {
      return path.join(config.files.uploadDir, userID, name);
    });

    const mixName = `mix_${Date.now()}`;
    const mixPath = path.join(config.files.mixesDir, userID, mixName);
    //for Linux
    const fullCommand = `cd  /home & ./mix1 ${mixPath} ${filesPath.join(
      " "
    )}`;
    // const fullCommand = `cd mixer\\app & mix1.exe ${mixPath} ${filesPath.join(
    //   " "
    // )}`;

    try {
      const { stdout } = await execPromise(fullCommand);

      if (!stdout.includes("Command: python convert.py")) {
        return false;
      } else {
        return mixName;
      }
    } catch (err) {
      console.log("err:    ", err);
      return false;
    }
  }
}

export default Mixer;
