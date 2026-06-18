import express from "express";
import {
  getFollowingFeed,
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/feed", verifyJWT, getFollowingFeed);
router.post("/:channelId/toggle", verifyJWT, toggleSubscription);
router.get("/:channelId/subscribers", verifyJWT, getUserChannelSubscribers);
router.get("/:subscriberId/subscriptions", verifyJWT, getSubscribedChannels);

export default router;
