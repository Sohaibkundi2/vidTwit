import mongoose, { isValidObjectId } from 'mongoose'
import { User } from '../models/user.model.js'
import { Subscription } from '../models/subscription.model.js'
import { Notification } from '../models/notification.model.js'
import  ApiError  from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponce.js'
import { asyncHandler } from '../utils/asyncHandler.js'

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

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels }
