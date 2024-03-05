// ! this is the file where most of the routes are defined
import Router from "express";
import {
   loginUser,
   registerUser,
   logOutUser,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentUser,
   updateAccountDetails,
   getUserChannelProfile,
   getWatchHistory,
} from "../controllers/user.controller.js";

import { updateUserAvatar } from "../controllers/avatarUpdate.controller.js";
import { updateUserCoverImage } from "../controllers/coverImageUpdate.controller.js";
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
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router
   .route("/avatar")
   .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router
   .route("/cover-image")
   .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);
router.route("/channel/:username").get(verifyJWT, getUserChannelProfile);
router.route("/watch-history").get(verifyJWT, getWatchHistory);

export default router;
