import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { checkOwnership } from "../middlewares/checkOwnership.js";
import { Video } from "../models/video.model.js";
import {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
} from "../controllers/video.controller.js";

import  upload  from "../middlewares/multer.middleware.js"; 

const router = Router();

router.get("/", getAllVideos);

router.get("/:videoId", getVideoById);

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
