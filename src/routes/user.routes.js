// ! this is the file where most of the routes are defined
import Router from "express";
import {
   loginUser,
   registerUser,
   logOutUser,
   refreshAccessToken,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

// Storing router reference
const router = Router();

// Defining what to do when "/register" end point is hit
// using upload function from multer to get avatar and coverImages
// using post method
// route().post(things to upload,function to invoke for the registration )
router.route("/register").post(
   upload.fields([
      {
         name: "avatar",
         maxCount: 1,
      },
      {
         name: "coverImage",
         maxCount: 1,
      },
   ]),

   registerUser
);

router.route("/login").post(loginUser);

// secured routes

// first verify the user and then set the next() to logout
router.route("/logout").post(verifyJWT, logOutUser);
router.route("/refresh-token").post(refreshAccessToken);

export default router;
