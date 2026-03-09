import mongoose, { isValidObjectId } from 'mongoose'
import { Subscription } from '../models/subscription.model.js'
import { Notification } from '../models/notification.model.js'
import { Video } from '../models/video.model.js'
import { Tweet } from '../models/tweet.model.js'
import { Repost } from '../models/repost.model.js'
import  ApiError  from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponce.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const attachFeedVideoState = async (videos, user) => {
  if (!videos.length) {
    return videos
  }

  const watchLaterIds = new Set((user?.watchLater || []).map(id => id.toString()))
  const videoIds = videos.map(video => video._id)
  const repostCounts = await Repost.aggregate([
    {
      $match: {
        video: { $in: videoIds },
      },
    },
    {
      $group: {
        _id: '$video',
        repostCount: { $sum: 1 },
      },
    },
  ])

  const repostCountMap = new Map(
    repostCounts.map(item => [item._id.toString(), item.repostCount]),
  )

  let repostedVideoIds = new Set()

  if (user?._id) {
    const userReposts = await Repost.find({
      repostedBy: user._id,
      video: { $in: videoIds },
    }).select('video')

    repostedVideoIds = new Set(
      userReposts.map(repost => repost.video.toString()),
    )
  }

  return videos.map(video => ({
    ...video,
    isInWatchLater: watchLaterIds.has(video._id.toString()),
    repostCount: repostCountMap.get(video._id.toString()) || 0,
    isReposted: repostedVideoIds.has(video._id.toString()),
  }))
}

const attachFeedTweetState = async (tweets, userId) => {
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

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params || {}
  const userId = req.user._id

  if (!channelId) {
    throw new ApiError(400, 'Channel ID is required')
  }

  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, 'Invalid Channel ID')
  }

  if (userId.toString() === channelId.toString()) {
    throw new ApiError(400, 'You cannot subscribe to your own channel')
  }

  const existSubscriber = await Subscription.findOne({
    channel: channelId,
    subscriber: userId,
  })

  let message

  if (existSubscriber) {
    await existSubscriber.deleteOne()
    message = 'unsubscribed successfully'
  } else {
    await Subscription.create({
      channel: channelId,
      subscriber: userId,
    })
    message = 'subscribed successfully'

    // Notification Logic
    try {
        const notification = await Notification.create({
            recipient: channelId,
            sender: req.user._id,
            type: 'SUBSCRIBE',
            message: `${req.user.username} subscribed to your channel`,
            url: `/c/${req.user.username}`
        });

        // Emit socket event
        if (req.io) {
            req.io.to(channelId.toString()).emit('new-notification', notification);
        }
    } catch (error) {
        console.error("Error sending notification for subscription:", error);
    }
  }

  return res.status(200).json(new ApiResponse(200, null, message))
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params || {}

  if (!channelId) {
    throw new ApiError(400, 'Channel ID is required')
  }

  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, 'Invalid channel ID')
  }

  const subscribers = await Subscription.find({ channel: channelId }).populate(
    'subscriber',
    'username avatar fullName',
  )

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, 'Subscriber list fetched successfully'),
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params

  if (!mongoose.Types.ObjectId.isValid(subscriberId)) {
    throw new ApiError(400, 'Invalid subscriber ID')
  }

  const channels = await Subscription.find({
    subscriber: subscriberId,
  }).populate('channel', 'username avatar fullName')

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channels,
        'Subscribed channels fetched successfully',
      ),
    )
})

const getFollowingFeed = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 30)
  const fetchCount = page * limit
  const sliceStart = (page - 1) * limit

  const subscriptions = await Subscription.find({
    subscriber: req.user._id,
  }).populate('channel', 'username avatar fullName')

  const followedChannels = subscriptions
    .map(subscription => subscription.channel)
    .filter(Boolean)

  if (!followedChannels.length) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          items: [],
          videos: [],
          tweets: [],
          channels: [],
          page,
          limit,
          totalItems: 0,
          hasMore: false,
        },
        'Following feed fetched successfully',
      ),
    )
  }

  const channelIds = followedChannels.map(channel => channel._id)

  const [videoDocs, tweetDocs] = await Promise.all([
    Video.find({
      owner: { $in: channelIds },
      isPublished: true,
    })
      .populate('owner', 'username avatar fullName')
      .sort({ createdAt: -1 })
      .limit(fetchCount),
    Tweet.find({
      owner: { $in: channelIds },
    })
      .populate('owner', 'username avatar fullName')
      .sort({ createdAt: -1 })
      .limit(fetchCount),
  ])

  const videos = await attachFeedVideoState(
    videoDocs.map(video => video.toObject()),
    req.user,
  )
  const tweets = await attachFeedTweetState(
    tweetDocs.map(tweet => tweet.toObject()),
    req.user._id,
  )

  const feedItems = [
    ...videos.map(video => ({
      type: 'video',
      createdAt: video.createdAt,
      data: video,
    })),
    ...tweets.map(tweet => ({
      type: 'tweet',
      createdAt: tweet.createdAt,
      data: tweet,
    })),
  ]
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))

  const pagedItems = feedItems.slice(sliceStart, sliceStart + limit)

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        items: pagedItems,
        videos,
        tweets,
        channels: followedChannels,
        page,
        limit,
        totalItems: feedItems.length,
        hasMore: sliceStart + limit < feedItems.length,
      },
      'Following feed fetched successfully',
    ),
  )
})

export {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels,
  getFollowingFeed,
}
