import { ObjectId } from "mongodb";

import Update from "../Update.ts";
import config from "../../config/config.ts";

class HistoryDB {
  constructor() {}

  async addHistoryItemToUser(userId, historyItem) {
    const optionsForUpdate = {
      filtr: {
        _id: new ObjectId(userId),
      },
      updateDoc: {
        $push: { history: historyItem },
      },
    };
    const updateResult = await Update.one(
      config.db.collections.users,
      optionsForUpdate
    );
    return updateResult;
  }
}

export default new HistoryDB();
