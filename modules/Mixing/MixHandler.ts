import RequestHandle from "../../core/RequestHandle.ts";
import { IncomingMessage } from "node:http";
import UserHandler from "../../modules/User/UserHandler.ts";
import FileService from "../FileService/FileService.ts";
import HistoryService from "../HistoryService/HistoryService.ts";
import Mixer from "../../mixer/Mixer.ts";

class MixHandler extends RequestHandle {
  async uploadFileFromUser(req: IncomingMessage, res: any) {
    const userProfile = await UserHandler.getUserProfileByCookie(req, res);
    if (!userProfile) {
      this.sendBadRequest(res);
      return;
    }
    const userFolder = await FileService.createDirectoryForUser(
      userProfile._id.toString()
    );

    const saveResult = await FileService.saveFilesToFileSystem(req, userFolder);

    if (!saveResult) {
      this.sendBadRequest(res);
      return;
    }
    const files = saveResult.files;
    const addResult = await HistoryService.addFilesToUserHistory(
      userProfile._id.toString(),
      files
    );

    if (!addResult) {
      this.sendBadRequest(res, "Cannot add to history");
      return;
    }

    this.sendResponse(res, { status: true }, "application/json");
    const mixer = new Mixer();
    const mixResult = await mixer.executeCommand(
      userProfile._id.toString(),
      files.map((i) => i.newFilename)
    );
    console.log(mixResult);
  }
}

export default new MixHandler();
