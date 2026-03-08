import { Router } from "express";

import { optionalVerifyJWT, verifyJWT } from "../middlewares/auth.middleware.js";

import { getAllTweets, getTweetById, createTweet, getUserTweets, toggleTweetRepost, updateTweet, deleteTweet } from "../controllers/tweet.controller.js";

const router = Router();



router.get("/", optionalVerifyJWT, getAllTweets); 
router.get("/detail/:tweetId", optionalVerifyJWT, getTweetById);
router.get("/:userId", optionalVerifyJWT, getUserTweets);           // GET  /api/v1/tweets/:userId
router.post("/:tweetId/repost-toggle", verifyJWT, toggleTweetRepost);
router.post("/",verifyJWT, createTweet);                   // POST /api/v1/tweets/
router.put("/:tweetId",verifyJWT, updateTweet);            // PUT  /api/v1/tweets/:tweetId
router.delete("/:tweetId",verifyJWT, deleteTweet);         // DELETE /api/v1/tweets/:tweetId


export default router;