import RequestHandle from "../../core/RequestHandle.ts";
import Insert from "../../db/Insert.ts";
import Update from "../../db/Update.ts";
import config from "../../config/config.ts";
import getRandomString from "./../../utils/getRandomString.ts";
import UserDB from "../../db/modules/UserDB.ts";

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
  async registerUser(req, res, userData) {
    if (!this.checkSchema(userData, this.shema)) {
      this.sendBadRequest(res);
      return;
    }

    const { fullName, password, passwordConfirm, email } = userData;
    if (password !== passwordConfirm) {
      this.sendUserData(res, { error: "Passwords do not match" }, false);
      return;
    }
    if (await this.checkExistUSer(email)) {
      this.sendUserData(res, { error: "User already exists" }, false);
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
      await this.autorizeUser(req, res, insertResult.insertedId);
    } else {
      console.log("Вставка документа юзера пройшла невдало");
    }
  }

  async checkExistUSer(email: string) {
    const user = await UserDB.findUserByEmail(email);
    return !!user;
  }

  async sendUserData(res, user = null, status = false) {
    const msgResponse = {
      status,
      data: user,
    };
    this.sendResponse(res, msgResponse, "application/json", 200);
  }

  async getUserProfileByCookie(req, res, cookiesValue?) {
    const sessionId = cookiesValue
      ? cookiesValue
      : this.getCookies(req, res, config.cookies.names.session);
    const user = await UserDB.findUserByCookies(sessionId, {
      projection: { email: true, fullName: true },
    });

    return user;
  }

  async getUserProfile(req, res) {
    const user = await this.getUserProfileByCookie(req, res);
    if(!user){
      this.unauthorized(res);
      return;
    }

      this.sendUserData(res, user, true);
      return;
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
    this.sendResponse(res, { status: false }, "application/json");
  }

  async loginUser(req, res, userData) {
    const { email, password } = userData;
    if (
      !this.checkSchema(userData, {
        email: this.shema.email,
        password: this.shema.password,
      })
    ) {
      this.sendBadRequest(res);
      return;
    }
    const user = await UserDB.findUserByEmail(email);
    if (!user) {
      this.sendUserData(res, { error: "User not found" }, false);
      return;
    }

    if (!this.passwordCompare(password, user.password)) {
      this.sendUserData(res, { error: "Password is incorrect" }, false);
      return;
    }

    await this.autorizeUser(req, res, user._id);
  }

  async passwordCompare(targetPassword: string, currentPassword: string) {
    return targetPassword === currentPassword;
  }

  async autorizeUser(req, res, userId) {
    const cookie = await this.addCookieDB(userId);
    if (cookie) {
      this.setCookies(req, res, config.cookies.names.session, cookie);
      const user = await this.getUserProfileByCookie(req, res, cookie);
      this.sendUserData(res, user, true);
    } else {
      this.sendBadRequest(res);
    }
  }
}

export default new UserHandler();
