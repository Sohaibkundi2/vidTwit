import { Router } from "express";
import { optionalVerifyJWT, verifyJWT } from "../middlewares/auth.middleware.js";
import { checkOwnership } from "../middlewares/checkOwnership.js";
import { Video } from "../models/video.model.js";
import {
  getAllVideos,
  getTrendingVideos,
  publishAVideo,
  getVideoById,
  toggleVideoRepost,
  getWatchLaterVideos,
  addToWatchLater,
  removeFromWatchLater,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
} from "../controllers/video.controller.js";

import  upload  from "../middlewares/multer.middleware.js"; 

const router = Router();

router.get("/", optionalVerifyJWT, getAllVideos);

router.get("/trending", optionalVerifyJWT, getTrendingVideos);

router.get("/watch-later", verifyJWT, getWatchLaterVideos);

router.post("/:videoId/repost-toggle", verifyJWT, toggleVideoRepost);

router.post("/:videoId/watch-later", verifyJWT, addToWatchLater);

router.delete("/:videoId/watch-later", verifyJWT, removeFromWatchLater);

router.get("/:videoId", optionalVerifyJWT, getVideoById);

router.post(
  "/publish",
  verifyJWT,
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  publishAVideo
);

router.put(
  "/:videoId",
  verifyJWT,
  checkOwnership(Video, "videoId"),
  upload.single("thumbnail"),
  updateVideo
);

router.delete(
  "/:videoId",
  verifyJWT,
  checkOwnership(Video, "videoId"),
  deleteVideo
);

router.patch(
  "/:videoId/toggle",
  verifyJWT,
  checkOwnership(Video, "videoId"),
  togglePublishStatus
);

export default router;
