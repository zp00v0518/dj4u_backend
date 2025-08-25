import RequestHandle from "../../core/RequestHandle.ts";
import Find from "../../db/Find.ts";
import Insert from "../../db/Insert.ts";
import config from "../../config/config.ts";
import getRandomString from "./../../utils/getRandomString.ts";

class UserHandler extends RequestHandle {
  constructor() {
    super();
    this.shema = {
      email: { type: "string", regExp: /^[\w\.\d-_`]+@[\w\.\d-_]+\.\w{2,4}$/i },
      password: { type: "string" },
      passwordConfirm: { type: "string" },
      fullName: { type: "string" },
    };
  }
  async registerUser(userData, req, res) {
    if (!this.checkSchema(userData, this.shema)) {
      this.sendBadRequest(res);
      return;
    }

    const msgResponse = {
      status: false,
      data: {},
    };
    const { fullName, password, passwordConfirm, email } = userData;
    if (password !== passwordConfirm) {
      msgResponse.data = { error: "Passwords do not match" };
      this.sendResponse(res, msgResponse, "application/json", 400);
      return;
    }
    if (await this.checkExistUSer(email)) {
      msgResponse.data = { error: "User already exists" };
      this.sendResponse(res, msgResponse, "application/json", 400);
      return;
    }

    const newUser = {
      email: email,
      password,
      fullName: fullName,
      createdAt: new Date(),
    };

    const insertResult = await Insert.insertOne(config.db.collections.users, {
      doc: newUser,
    });
    if (insertResult.acknowledged) {
    } else {
      console.log("Вставка документа юзера пройшла невдало");
    }
  }

  async checkExistUSer(email: string) {
    const existingUser = await Find.findOne(config.db.collections.users, {
      email,
    });
    return !!existingUser;
  }

  async getUserProfile(undefined, req, res) {
    const sessionId = this.getCookies(req, res, "sessionId");
    if (!sessionId) {
      this.sendResponse(res, { status: false, data: null }, "application/json");
      return;
    }
    // try {
    //   const user = await Find.findOne(config.db.collections.users, {
    //     _id: new ObjectId(sessionId),
    //   });

    //   if (!user) {
    //     this.sendResponse(
    //       res,
    //       { error: "Unauthorized" },
    //       "application/json",
    //       401
    //     );
    //     return;
    //   }

    //   // Видаляємо чутливі дані (наприклад, пароль) перед відправкою
    //   const userProfile = {
    //     _id: user._id,
    //     login: user.login,
    //     nickName: user.nickName,
    //   };

    //   this.sendResponse(res, userProfile, "application/json", 200);
    // } catch (error) {
    //   console.error("Помилка при отриманні профілю:", error);
    //   this.sendResponse(
    //     res,
    //     { error: "Internal Server Error" },
    //     "application/json",
    //     500
    //   );
    // }
  }

  setCookieUser(userId, cookie = getRandomString(config.cookieSize)) {
    // const cookie = getRandomString(config.cookieSize);
    const optionsForUpdate = {
      collectionName: config.db.collections.users,
      filtr: {
        _id: userId,
      },
      updateDoc: {
        $set: { cookie: cookie, "date.addCookie": new Date() },
      },
    };
    update.one(optionsForUpdate).then((resultUpdate) => {});
    return cookie;
  }
}

export default new UserHandler();
