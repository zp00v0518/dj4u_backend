import HistoryDB from '../../db/modules/HistoryDB.ts'

class HistoryService {
  async addFilesToUserHistory(userId, files: Array) {
    const historyItem = this.createHistoryItem(files)

    const saveResult = await HistoryDB.addHistoryItemToUser(userId, historyItem)

    if (saveResult.modifiedCount === 0) return false 
    return true
  }

  createHistoryItem(files: Array) {
    return {
      createdAt: Date.now(),
      mixStatus: "",
      mixName: "",
      loadCount: 0,
      files: files.map((i) => i.newFilename),
    };
  }
}

export default new HistoryService();
