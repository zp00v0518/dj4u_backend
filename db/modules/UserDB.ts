import { ObjectId } from "mongodb";

import Find from "../Find.ts";
import config from "../../config/config.ts";

class UserDB {
  constructor() {}

  async findUserByEmail(email: string, options = {}) {
    const user = await Find.findOne(
      config.db.collections.users,
      {
        email,
      },
      { projection: options?.projection }
    );
    return user;
  }

  async findUserByCookies(cookie: string, options = {}) {
    const user = await Find.findOne(
      config.db.collections.users,
      {
        cookie,
      },
      { projection: options?.projection }
    );
    return user;
  }
}

export default new UserDB();
