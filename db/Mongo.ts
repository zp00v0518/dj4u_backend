import { MongoClient } from "mongodb";
import config from "../config/config.ts";

class Mongo {
  static dbUrl = process.env.MONGO_URL || "mongodb://localhost:27017";
  constructor() {
    this.client = null;
    this.db = null;
  }
  async connectClient(dbName = config.db.name, dbUrl = Mongo.dbUrl) {
    if (this.client) {
      return this.client;
    }
    try {
      this.client = new MongoClient(dbUrl, {
        monitorCommands: true,
      });
      this.connectToDb(dbName);
      console.log("Підключення до БД успішне")
      return this.client;
    } catch (error) {
      console.error("MongoDB connection error:", error);
      throw error;
    }
  }
  connectToDb(dbName) {
    this.db = this.client.db(dbName);
  }

  async connectAll(dbName = config.db.name, dbUrl = Mongo.dbUrl) {
    if (!this.client) await this.connectClient(dbName, dbUrl);
    if (!this.db) this.connectToDb(dbName);
    return !!this.client && !!this.db;
  }
  async closeClient() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }
}

export default Mongo;
