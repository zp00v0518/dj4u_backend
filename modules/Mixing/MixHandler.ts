import RequestHandle from "../../core/RequestHandle.ts";
import { IncomingMessage } from "node:http";
import UserHandler from "../../modules/User/UserHandler.ts";
import FileService from "../FileService/FileService.ts";

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
    console.log(saveResult);

  }
}

export default new MixHandler();
