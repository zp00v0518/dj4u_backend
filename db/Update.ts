import { ObjectId } from "mongodb";
import Mongo from "./Mongo.ts";

class Update extends Mongo {
  constructor() {
    super();
  }

  async one(collection, options) {
    const isConnect = await this.connectAll();
    if (!isConnect) {
      console.log("MongoDB connection error");
      return;
    }
    console.log(options)
    const result = await this.db.collection(collection).updateOne(options.filtr, options.updateDoc);
    return result;
  }
}

export default new Update();
