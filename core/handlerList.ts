import UserHandler from "../modules/User/UserHandler.ts"

const handlerList ={
    '/registration': UserHandler.registerUser.bind(UserHandler),
    '/profile': UserHandler.getUserProfile.bind(UserHandler)
}

export default handlerList