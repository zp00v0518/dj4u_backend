import { ObjectId } from "mongodb";
import Mongo from "./Mongo.ts";

class Insert extends Mongo {
  constructor() {
    super();
  }

  async insertOne(collection, options) {
    const isConnect = await this.connectAll();
    if (!isConnect) {
      console.log("MongoDB connection error");
      return;
    }
    const result = await this.db.collection(collection).insertOne(options.doc);
    return result;
  }
}

export default new Insert();
