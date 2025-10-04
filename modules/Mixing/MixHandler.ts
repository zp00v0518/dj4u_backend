import RequestHandle from "../../core/RequestHandle.ts";
import { IncomingMessage } from "node:http";
import UserHandler from "../../modules/User/UserHandler.ts";
import FileService from "../FileService/FileService.ts";
import HistoryService from "../HistoryService/HistoryService.ts";
import Mixer from "../../mixer/Mixer.ts";
import HistoryDB from "../../db/modules/HistoryDB.ts";
import config from '../../config/config.ts'
import fs from "node:fs/promises";
import path from "node:path";

class MixHandler extends RequestHandle {
  async uploadFileFromUser(req: IncomingMessage, res: any) {
    const userProfile = await UserHandler.getUserProfileByCookie(req, res);
    if (!userProfile) {
      this.sendBadRequest(res);
      return;
    }
    const userID = userProfile._id.toString();
    const userFolder = await FileService.createDirectoryForUser(userID);

    const saveResult = await FileService.saveFilesToFileSystem(req, userFolder);

    if (!saveResult) {
      this.sendBadRequest(res);
      return;
    }
    const files = saveResult.files;
    const filesNames = files.map((i) => i.newFilename);
    const addResult = await HistoryService.addFilesToUserHistory(
      userID,
      filesNames
    );

    if (!addResult) {
      this.sendBadRequest(res, "Cannot add to history");
      return;
    }

    const mixer = new Mixer();
    const mixResult = await mixer.executeCommand(
      userProfile._id.toString(),
      filesNames
    );
    if (!mixResult) {
      await HistoryDB.setStatusHistoryItem(userID, filesNames, "canceled");
      this.sendBadRequest(res);
    }
    await HistoryDB.setMixNameToHistoryItem(userID, filesNames, mixResult);
    this.sendResponse(res, { status: true }, {"Content-Type":"application/json"});
  }

  async downloadFileFromUser(req: IncomingMessage, res: any) {
    const userProfile = await UserHandler.getUserProfileByCookie(req, res);
    if (!userProfile) {
      this.sendBadRequest(res);
      return;
    }
    const userID = userProfile._id.toString();
    const userDir = FileService.getPathToUserMixes(userID)
    const filename = req.url.replace(config.server.downloadUrl, '')
    console.log(path.resolve(userDir, filename));
    const fsStat = await fs.stat(path.resolve(userDir, filename))
    console.log(fsStat)
    // this.sendResponse(res, { status: true }, "application/json");
  }
}

export default new MixHandler();
