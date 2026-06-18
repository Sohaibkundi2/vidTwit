import mongoose from 'mongoose'
import { Like } from '../models/like.model.js'
import { Video } from '../models/video.model.js'
import { Comment } from '../models/comment.model.js'
import { Notification } from '../models/notification.model.js'
import ApiError from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponce.js'
import { asyncHandler } from '../utils/asyncHandler.js'

// Toggle Video Like
const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, 'Invalid or missing video ID')
  }

  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: req.user._id
  })

  if (existingLike) {
    await existingLike.deleteOne()
    return res.status(200).json(new ApiResponse(200, null, 'Like removed from video'))
  }

  const newLike = new Like({
    likedBy: req.user._id,
    video: videoId
  })

  await newLike.save()

  // Notification Logic
  try {
      const video = await Video.findById(videoId);
      if (video && video.owner.toString() !== req.user._id.toString()) {
          const notification = await Notification.create({
              recipient: video.owner,
              sender: req.user._id,
              type: 'LIKE',
              message: `${req.user.username} liked your video "${video.title}"`,
              url: `/video/${videoId}`
          });

          // Emit socket event
          if (req.io) {
              req.io.to(video.owner.toString()).emit('new-notification', notification);
          }
      }
  } catch (error) {
      console.error("Error sending notification for like:", error);
      // Don't fail the request if notification fails
  }

  return res.status(200).json(new ApiResponse(200, newLike, 'Video liked successfully'))
})

// Get all liked videos
const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user._id

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, 'Invalid user ID')
  }

  const likes = await Like.find({ likedBy: userId, video: { $exists: true } })
    .populate({
      path: 'video',
      populate: {
        path: 'owner',
        select: 'username fullName avatar'
      }
    })
    .sort({ createdAt: -1 })

  const likedVideos = likes.map(like => like.video).filter(Boolean)

  return res.status(200).json(
    new ApiResponse(200, likedVideos, 'Liked videos fetched successfully')
  )
})

// Get video like count
const getVideoLikeCount = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, 'Invalid or missing video ID')
  }

  const count = await Like.countDocuments({ video: videoId })

  return res.status(200).json(
    new ApiResponse(200, { count }, 'Like count fetched successfully')
  )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params

  if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, 'Invalid or missing comment ID')
  }

  const comment = await Comment.findById(commentId)
    .populate('owner', 'username fullName avatar')
    .populate('video', 'title')

  if (!comment) {
    throw new ApiError(404, 'Comment not found')
  }

  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  })

  let isLiked = false

  if (existingLike) {
    await existingLike.deleteOne()
  } else {
    await Like.create({
      likedBy: req.user._id,
      comment: commentId,
    })
    isLiked = true

    try {
      if (comment.owner?._id?.toString() !== req.user._id.toString()) {
        const notification = await Notification.create({
          recipient: comment.owner._id,
          sender: req.user._id,
          type: 'LIKE',
          message: `${req.user.username} liked your comment`,
          url: `/watch/${comment.video?._id || ''}`,
        })

        if (req.io) {
          req.io
            .to(comment.owner._id.toString())
            .emit('new-notification', notification)
        }
      }
    } catch (error) {
      console.error('Error sending notification for comment like:', error)
    }
  }

  const likeCount = await Like.countDocuments({ comment: commentId })

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        commentId,
        isLiked,
        likeCount,
      },
      isLiked ? 'Comment liked successfully' : 'Comment like removed successfully',
    ),
  )
})

const getCommentLikeCount = asyncHandler(async (req, res) => {
  const { commentId } = req.params

  if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, 'Invalid or missing comment ID')
  }

  const count = await Like.countDocuments({ comment: commentId })

  return res.status(200).json(
    new ApiResponse(200, { count }, 'Comment like count fetched successfully')
  )
})

export {
  toggleVideoLike,
  getLikedVideos,
  getVideoLikeCount,
  toggleCommentLike,
  getCommentLikeCount,
}
