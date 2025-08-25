import RequestHandle from "../../core/RequestHandle.ts";
import Find from "../../db/Find.ts";
import config from "../../config/config.ts";

class UserHandler extends RequestHandle {
  constructor() {
    super();
    this.shema = {
      login: { type: "string", regExp: /^[\w\.\d-_`]+@[\w\.\d-_]+\.\w{2,4}$/i },
      password: { type: "string" },
      repeatPassword: { type: "string" },
      nickName: { type: "string" },
    };
  }
  async registerUser(userData, res) {
    if (!this.checkSchema(userData, this.shema)) {
      this.sendBadRequest(res);
      return;
    }
    console.log(userData);
    const { login, password, repeatPassword } = userData;
    if (password !== repeatPassword) {
      this.sendResponse(
        res,
        { error: "Passwords do not match" },
        "application/json",
        400
      );
      return;
    }
    if (await this.checkExistUSer(login)) {
      this.sendResponse(
        res,
        { error: "User already exists" },
        "application/json",
        400
      );
      return;
    }
  }

  async checkExistUSer(login: string) {
    const existingUser = await Find.findOne(config.db.collections.users, {
      login,
    });
    return !!existingUser;
  }
  async getUserProfile(undefined, req, res) {
    const sessionId = this.getCookies(req, res, "sessionId");
    if (!sessionId) {
      this.sendResponse(res, { status: true, data: 111 }, "application/json");
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
}

export default new UserHandler();
