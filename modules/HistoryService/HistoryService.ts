import HistoryDB from "../../db/modules/HistoryDB.ts";

class HistoryService {
  async addFilesToUserHistory(userId: string, filesNames: []) {
    const historyItem = this.createHistoryItem(filesNames);

    const saveResult = await HistoryDB.addHistoryItemToUser(
      userId,
      historyItem
    );

    if (saveResult.modifiedCount === 0) return false;
    return true;
  }

  createHistoryItem(filesNames: []) {
    return {
      createdAt: Date.now(),
      mixStatus: "pending",
      mixName: "",
      loadCount: 0,
      files: filesNames,
    };
  }
}

export default new HistoryService();
