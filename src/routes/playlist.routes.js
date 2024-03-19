import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    getUserPlaylist,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
} from "../controllers/tweet.controller.js ";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();

router.use(verifyJWT, upload.none());

router.route("/").post(createPlaylist);
router
    .route("/:playlistId")
    .get(getPlaylistById)
    .patch(updatePlaylist)
    .delete(deletePlaylist);

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);
router.route("/user/:userId").get(getUserPlaylist);

export default router;
