import UserHandler from "../modules/User/UserHandler.ts"
import MixHandler from "../modules/Mixing/MixHandler.ts"
import config from '../config/config.ts'

const handlerList ={
    '/profile/registration': UserHandler.registerUser.bind(UserHandler),
    '/profile/login': UserHandler.loginUser.bind(UserHandler),
    '/profile': UserHandler.getUserProfile.bind(UserHandler),
    '/file/upload': MixHandler.uploadFileFromUser.bind(MixHandler),
    [config.server.downloadUrl]: MixHandler.downloadFileFromUser.bind(MixHandler),

}

export default handlerList