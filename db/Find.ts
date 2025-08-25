import { ObjectId } from "mongodb";
import Mongo from "./Mongo.ts";

class Find extends Mongo {
  constructor() {
    super();
  }

  async findOne(collection, query, dbName) {
    const isConnect = await this.connectAll(dbName);
    if (!isConnect) {
      console.log("MongoDB connection error");
      return;
    }
    const result = await this.db.collection(collection).findOne(query);
    return result;
  }

  //   async findMany(collection, query) {
  //     const client = await this.connectClient();
  //     const db = client.db("lords");
  //     const result = await db.collection(collection).find(query).toArray();
  //     return result;
  //   }

  //   async findById(collection, id) {
  //     const client = await this.connectClient();
  //     const db = client.db("lords");
  //     const result = await db.collection(collection).findOne({ _id: new ObjectId(id) });
  //     return result;
  //   }
}

export default new Find();
