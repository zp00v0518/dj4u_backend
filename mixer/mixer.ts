import { exec } from "node:child_process";
import { promisify } from "node:util";

import fs from "node:fs/promises";
import path from "node:path";
import config from "../config/config.ts";

const execPromise = promisify(exec);

class Mixer {
  async executeCommand(userID, filesName) {
    // const userID = "68b469a941bbbaf3f5493f20";
    // const filesName = ["1.mp3", "2.mp3"];

    const filesPath = filesName.map((name) => {
      return path.join(config.files.uploadDir, userID, name);
    });

    const mixName = `mix_${Date.now()}`;
    const mixPath = path.join(config.files.mixesDir, userID, mixName);
    const fullCommand = `cd app & mix1.exe ${mixPath}  ${filesPath.join(" ")}`;

    try {
      const { stdout, stderr } = await execPromise(fullCommand);

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


export default Mixer
// const mixer = new Mixer();
// mixer.executeCommand();
