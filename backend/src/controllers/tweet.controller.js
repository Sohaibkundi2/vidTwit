import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import { Repost } from "../models/repost.model.js"
import {ApiResponse} from "../utils/ApiResponce.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import ApiError from './../utils/ApiError.js';

const attachTweetRepostState = async (tweets, userId) => {
  if (!tweets.length) {
    return tweets
  }

  const tweetIds = tweets.map(tweet => tweet._id)
  const repostCounts = await Repost.aggregate([
    {
      $match: {
        tweet: { $in: tweetIds },
      },
    },
    {
      $group: {
        _id: '$tweet',
        repostCount: { $sum: 1 },
      },
    },
  ])

  const repostCountMap = new Map(
    repostCounts.map(item => [item._id.toString(), item.repostCount]),
  )

  let repostedTweetIds = new Set()

  if (userId) {
    const userReposts = await Repost.find({
      repostedBy: userId,
      tweet: { $in: tweetIds },
    }).select('tweet')

    repostedTweetIds = new Set(
      userReposts.map(repost => repost.tweet.toString()),
    )
  }

  return tweets.map(tweet => ({
    ...tweet,
    repostCount: repostCountMap.get(tweet._id.toString()) || 0,
    isReposted: repostedTweetIds.has(tweet._id.toString()),
  }))
}


const getAllTweets = asyncHandler(async (req, res) => {
  const tweets = await Tweet.find({})
    .populate("owner", "username avatar")
    .sort({ createdAt: -1 });

  const tweetsWithRepostState = await attachTweetRepostState(
    tweets.map(tweet => tweet.toObject()),
    req.user?._id,
  )

  res.status(200).json(new ApiResponse(200, tweetsWithRepostState, "All tweets fetched"));
});

const getTweetById = asyncHandler(async (req, res) => {
  const { tweetId } = req.params

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, 'Invalid tweet ID')
  }

  const tweet = await Tweet.findById(tweetId).populate('owner', 'username fullName avatar')

  if (!tweet) {
    throw new ApiError(404, 'Tweet not found')
  }

  const [tweetWithRepostState] = await attachTweetRepostState(
    [tweet.toObject()],
    req.user?._id,
  )

  return res.status(200).json(
    new ApiResponse(200, tweetWithRepostState, 'Tweet fetched successfully'),
  )
})


const createTweet = asyncHandler(async (req, res) => {
    let { content } = req.body

    if(!content?.trim()){
        throw new ApiError(400, "content is required")
    }
      content = content?.trim();
    if(content.length < 1){
        throw new ApiError(400, "content must be at least 1 character")
    }

    if(content?.length > 280){
        throw new ApiError(400, "content must be less than 280 characters")
    }

    const tweet = await Tweet.create({
        content,
        owner:req.user?._id
    })

    return res
    .status(201)
    .json(
        new ApiResponse(201,tweet,"Tweet created successfully")
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    const userId = req.params.userId

      if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

    const userExists = await User.findById(userId);
  if (!userExists) {
    throw new ApiError(404, "User not found");
  }

  const tweets = await Tweet.find({ owner: userId })
  .populate("owner", "username fullName avatar")
  .sort({ createdAt: -1 });

  const tweetsWithRepostState = await attachTweetRepostState(
    tweets.map(tweet => tweet.toObject()),
    req.user?._id,
  )

  return res.status(200).json(
    new ApiResponse(200, tweetsWithRepostState, "Fetched all tweets of user successfully")
  );
});

const toggleTweetRepost = asyncHandler(async (req, res) => {
  const { tweetId } = req.params

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, 'Invalid tweet ID')
  }

  const tweet = await Tweet.findById(tweetId).select('_id')

  if (!tweet) {
    throw new ApiError(404, 'Tweet not found')
  }

  const existingRepost = await Repost.findOne({
    repostedBy: req.user._id,
    tweet: tweet._id,
  })

  let isReposted = false

  if (existingRepost) {
    await existingRepost.deleteOne()
  } else {
    await Repost.create({
      repostedBy: req.user._id,
      tweet: tweet._id,
    })
    isReposted = true
  }

  const repostCount = await Repost.countDocuments({ tweet: tweet._id })

  return res.status(200).json(
    new ApiResponse(
      200,
      { tweetId, isReposted, repostCount },
      isReposted ? 'Tweet reposted successfully' : 'Tweet repost removed successfully',
    ),
  )
})

const updateTweet = asyncHandler(async (req, res) => {
  const tweetId = req.params.tweetId;
  let { content } = req.body; 

  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  if (tweet.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this tweet");
  }

  if (!content || typeof content !== "string") {
    throw new ApiError(400, "Content is required");
  }

  content = content.trim();

  if (content.length < 1) {
    throw new ApiError(400, "Content must be at least 1 character");
  }

  if (content.length > 280) {
    throw new ApiError(400, "Content must be less than 280 characters");
  }

  tweet.content = content;
  await tweet.save();

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet updated successfully"));
});


const deleteTweet = asyncHandler(async (req, res) => {
     const tweetId = req.params.tweetId;

  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  if (tweet.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this tweet");
  }

    await tweet.deleteOne();
  await Repost.deleteMany({ tweet: tweet._id })

    return res.status(200).json(
        new ApiResponse(200, null, "Tweet deleted successfully")
    )
})

export {
    getAllTweets,
  getTweetById,
    createTweet,
    getUserTweets,
  toggleTweetRepost,
    updateTweet,
    deleteTweet
}