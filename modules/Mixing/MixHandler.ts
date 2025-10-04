import RequestHandle from "../../core/RequestHandle.ts";
import { IncomingMessage } from "node:http";
import UserHandler from "../../modules/User/UserHandler.ts";
import FileService from "../FileService/FileService.ts";
import HistoryService from "../HistoryService/HistoryService.ts";
import Mixer from "../../mixer/Mixer.ts";
import HistoryDB from "../../db/modules/HistoryDB.ts";

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
    this.sendResponse(res, { status: true }, "application/json");
  }

  async downloadFileFromUser(req: IncomingMessage, res: any) {
    const userProfile = await UserHandler.getUserProfileByCookie(req, res);
    if (!userProfile) {
      this.sendBadRequest(res);
      return;
    }
    const userID = userProfile._id.toString();
    console.log(userID)
    console.log(req.url);
  }
}

export default new MixHandler();
