import { Router } from "express";
import { registerUser, loginUser , logoutUser, refreshAccessToken} from "../controllers/userController.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";



const router = Router()

router.route("/register").post( 
    upload.fields([
        {
            name : "avatar",
            maxCount : 1
        },
        {
            name : "coverImage",
            maxCount : 1
        }
    ]),
    registerUser
)


router.route("/login").post(loginUser)


// secured routes because here we have to check that the real user is present or not
router.route("/logout").post(verifyJWT,  logoutUser)
router.route("/refresh-token").post(refreshAccessToken)



export default router