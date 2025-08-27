import RequestHandle from "../../core/RequestHandle.ts";
import Find from "../../db/Find.ts";
import Insert from "../../db/Insert.ts";
import Update from "../../db/Update.ts";
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
      const cookie = await this.addCookieDB(insertResult.insertedId);
      if (cookie) {
        this.setCookies(req, res, config.cookies.names.session, cookie);
        // this.sendResponse(res, {}, "application/json")
        await this.getUserProfile(undefined, req, res, cookie);
      } else {
        this.sendBadRequest(res);
      }
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

  async getUserProfile(undefined, req, res, cookiesValue?) {
    const sessionId = cookiesValue
      ? cookiesValue
      : this.getCookies(req, res, config.cookies.names.session);
    if (!sessionId) {
      this.unauthorized(res);
      return;
    }
    try {
      const user = await Find.findOne(
        config.db.collections.users,
        {
          cookie: sessionId,
        },
        { projection: { email: true, fullName: true } }
      );

      if (!user) {
        this.unauthorized(res);
        return;
      }

      this.sendResponse(res, user, "application/json", 200);
    } catch (error) {
      console.error("Помилка при отриманні профілю:", error);
      this.sendResponse(
        res,
        { error: "Internal Server Error" },
        "application/json",
        500
      );
    }
  }

  async addCookieDB(
    userId,
    cookie = getRandomString(config.cookies.cookieSize)
  ) {
    const optionsForUpdate = {
      filtr: {
        _id: userId,
      },
      updateDoc: {
        $set: { cookie: cookie, addCookie: new Date() },
      },
    };
    const updateResult = await Update.one(
      config.db.collections.users,
      optionsForUpdate
    );
    return cookie;
  }

  async unauthorized(res) {
    this.sendResponse(res, { status: false, data: null }, "application/json");
  }
}

export default new UserHandler();
