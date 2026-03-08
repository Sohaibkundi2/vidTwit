import mongoose, { isValidObjectId } from 'mongoose'
import { Video } from '../models/video.model.js'
import { User } from '../models/user.model.js'
import { Like } from '../models/like.model.js'
import { Comment } from '../models/comment.model.js'
import ApiError from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponce.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import fs from 'fs'

const TRENDING_RANGES = {
  day: 1,
  week: 7,
}

const getTrendingStartDate = range => {
  const days = TRENDING_RANGES[range] || TRENDING_RANGES.week
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}
const attachWatchLaterState = (videos, watchLaterIds) =>
  videos.map(video => ({
    ...video,
    isInWatchLater: watchLaterIds.has(video._id.toString()),
  }))

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = 'createdAt',
    sortType = 'desc',
    userId,
  } = req.query

  // 1. Filter: Only published videos
  const filter = { isPublished: true }

  // 2. Optional: Search by title or description
  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
    ]
  }

  // 3. Optional: Filter by userId
  if (userId) {
    try {
      filter.owner = new mongoose.Types.ObjectId(userId)
    } catch (error) {
      throw new ApiError(400, 'Invalid user ID')
    }
  }

  // 4. Sorting setup
  const sort = {}
  sort[sortBy] = sortType === 'asc' ? 1 : -1

  // 5. Aggregation pipeline with lookup and project
  const aggregate = Video.aggregate([
    { $match: filter },
    { $sort: sort },
    {
      $lookup: {
        from: 'users', // collection name in MongoDB
        localField: 'owner',
        foreignField: '_id',
        as: 'owner',
      },
    },
    { $unwind: '$owner' },
    {
      $project: {
        title: 1,
        description: 1,
        thumbnail: 1,
        videoFile: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        createdAt: 1,
        owner: {
          _id: '$owner._id',
          username: '$owner.username',
          avatar: '$owner.avatar',
        },
      },
    },
  ])

  // 6. Pagination options
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  }

  // 7. Execute paginated aggregation
  const result = await Video.aggregatePaginate(aggregate, options)
  const watchLaterIds = new Set(
    (req.user?.watchLater || []).map(id => id.toString()),
  )
  const videosWithSaveState = attachWatchLaterState(result.docs, watchLaterIds)

  // 8. Respond with structured result
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos: videosWithSaveState,
        totalCount: result.totalDocs,
        totalPages: result.totalPages,
        page: result.page,
        limit: result.limit,
      },
      'Videos fetched successfully',
    ),
  )
})

const getTrendingVideos = asyncHandler(async (req, res) => {
  const { range = 'week', limit = 6 } = req.query
  const selectedRange = TRENDING_RANGES[range] ? range : 'week'
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 6, 1), 20)
  const startDate = getTrendingStartDate(selectedRange)

  const trendingVideos = await Video.aggregate([
    {
      $match: {
        isPublished: true,
      },
    },
    {
      $lookup: {
        from: 'likes',
        let: { videoId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$video', '$$videoId'] },
              createdAt: { $gte: startDate },
            },
          },
          {
            $count: 'count',
          },
        ],
        as: 'recentLikes',
      },
    },
    {
      $lookup: {
        from: 'comments',
        let: { videoId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$video', '$$videoId'] },
              createdAt: { $gte: startDate },
            },
          },
          {
            $count: 'count',
          },
        ],
        as: 'recentComments',
      },
    },
    {
      $addFields: {
        likeCount: {
          $ifNull: [{ $arrayElemAt: ['$recentLikes.count', 0] }, 0],
        },
        commentCount: {
          $ifNull: [{ $arrayElemAt: ['$recentComments.count', 0] }, 0],
        },
        ageInHours: {
          $dateDiff: {
            startDate: '$createdAt',
            endDate: '$$NOW',
            unit: 'hour',
          },
        },
      },
    },
    {
      $addFields: {
        recencyBoost: {
          $max: [0, { $subtract: [72, '$ageInHours'] }],
        },
        trendingScore: {
          $add: [
            '$views',
            { $multiply: ['$likeCount', 4] },
            { $multiply: ['$commentCount', 3] },
            { $divide: [{ $max: [0, { $subtract: [72, '$ageInHours'] }] }, 3] },
          ],
        },
      },
    },
    {
      $sort: {
        trendingScore: -1,
        likeCount: -1,
        commentCount: -1,
        views: -1,
        createdAt: -1,
      },
    },
    {
      $limit: parsedLimit,
    },
    {
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'owner',
      },
    },
    {
      $unwind: '$owner',
    },
    {
      $project: {
        title: 1,
        description: 1,
        thumbnail: 1,
        videoFile: 1,
        duration: 1,
        views: 1,
        createdAt: 1,
        likeCount: 1,
        commentCount: 1,
        trendingScore: { $round: ['$trendingScore', 1] },
        owner: {
          _id: '$owner._id',
          username: '$owner.username',
          avatar: '$owner.avatar',
        },
      },
    },
  ])

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        range: selectedRange,
        videos: trendingVideos,
      },
      'Trending videos fetched successfully',
    ),
  )
})

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body || {}

  if (!title || !description) {
    throw new ApiError(400, 'Title and description are required')
  }
  const existingVideo = await Video.findOne({
    title,
    owner: req.user._id,
  })
  if (existingVideo) {
    throw new ApiError(400, 'You already have a video with this title')
  }

  const videoFileLocalPath = req.files?.videoFile?.[0]?.path
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

  if (!videoFileLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, 'Video file and thumbnail are required')
  }

  let videoFileUrl, thumbnailUrl
  try {
    videoFileUrl = await uploadOnCloudinary(videoFileLocalPath)
    if (fs.existsSync(videoFileLocalPath)) {
      fs.unlinkSync(videoFileLocalPath)
    }
    thumbnailUrl = await uploadOnCloudinary(thumbnailLocalPath)
    if (fs.existsSync(thumbnailLocalPath)) {
      fs.unlinkSync(thumbnailLocalPath)
    }
  } catch (error) {
    throw new ApiError(500, 'Error uploading files to cloud storage')
  }

  if (!videoFileUrl?.url || !thumbnailUrl?.url) {
    throw new ApiError(500, 'Cloud upload failed')
  }

  const video = new Video({
    title,
    description,
    videoFile: videoFileUrl?.url,
    thumbnail: thumbnailUrl?.url,
    duration: Math.round(videoFileUrl?.duration),
    owner: req.user?._id,
  })

  const savedVideo = await video.save()

  return res
    .status(201)
    .json(new ApiResponse(201, savedVideo, 'Video published successfully'))
})

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, 'Invalid video ID')
  }

  const video = await Video.findById(videoId).populate(
    'owner',
    'username fullName avatar',
  )

  if (!video) {
    throw new ApiError(404, 'Video not found')
  }

  // ✅ If user is logged in
  if (req.user) {
    const alreadyViewed = video.viewedBy.some(
      (id) => id.toString() === req.user._id.toString()
    )

    if (!alreadyViewed) {
      video.views += 1
      video.viewedBy.push(req.user._id)
      await video.save({ validateBeforeSave: false })
    }
  } else {
    // ✅ If user is not logged in, still increase view count
    video.views += 1
    await video.save({ validateBeforeSave: false })
  }

  const videoResponse = video.toObject()
  const watchLaterIds = new Set(
    (req.user?.watchLater || []).map(id => id.toString()),
  )
  videoResponse.isInWatchLater = watchLaterIds.has(video._id.toString())

  return res
    .status(200)
    .json(new ApiResponse(200, videoResponse, 'Video fetched successfully'))
})

const getWatchLaterVideos = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('watchLater')

  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  if (!user.watchLater.length) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], 'No saved videos in watch later'))
  }

  const savedVideos = await Video.find({
    _id: { $in: user.watchLater },
    isPublished: true,
  })
    .populate('owner', 'username fullName avatar')
    .lean()

  const savedVideoOrder = new Map(
    user.watchLater.map((videoId, index) => [videoId.toString(), index]),
  )

  const orderedSavedVideos = savedVideos
    .sort(
      (firstVideo, secondVideo) =>
        savedVideoOrder.get(firstVideo._id.toString()) -
        savedVideoOrder.get(secondVideo._id.toString()),
    )
    .map(video => ({
      ...video,
      isInWatchLater: true,
    }))

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        orderedSavedVideos,
        'Watch later videos fetched successfully',
      ),
    )
})

const addToWatchLater = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid video ID')
  }

  const video = await Video.findById(videoId).select('_id isPublished owner')

  if (!video) {
    throw new ApiError(404, 'Video not found')
  }

  if (!video.isPublished && video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not allowed to save this video')
  }

  await User.findByIdAndUpdate(req.user._id, {
    $pull: { watchLater: video._id },
  })

  await User.findByIdAndUpdate(req.user._id, {
    $push: {
      watchLater: {
        $each: [video._id],
        $position: 0,
      },
    },
  })

  return res
    .status(200)
    .json(new ApiResponse(200, { videoId, isInWatchLater: true }, 'Video added to watch later'))
})

const removeFromWatchLater = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, 'Invalid video ID')
  }

  await User.findByIdAndUpdate(req.user._id, {
    $pull: { watchLater: videoId },
  })

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { videoId, isInWatchLater: false },
        'Video removed from watch later',
      ),
    )
})


const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  const { title, description } = req.body

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, 'Invalid video ID')
  }

  const video = await Video.findById(videoId)

  if (!video) {
    throw new ApiError(404, 'Video not found')
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not allowed to update this video')
  }

  if (title) video.title = title
  if (description) video.description = description

  // 5. Handle thumbnail upload if present
  const thumbnailLocalPath = req?.file?.path
  if (thumbnailLocalPath) {
    const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if (uploadedThumbnail?.url) {
      video.thumbnail = uploadedThumbnail.url
      if (fs.existsSync(thumbnailLocalPath)) {
        fs.unlinkSync(thumbnailLocalPath)
      }
    }
  }

  const updatedVideo = await video.save()

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, 'Video updated successfully'))
})

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, 'Invalid Video ID')
  }

  const video = await Video.findById(videoId)

  if (!video) {
    throw new ApiError(404, 'Video not found')
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not allowed to delete this video')
  }

  await video.deleteOne()
  await User.updateMany(
    {
      $or: [{ watchLater: video._id }, { watchHistory: video._id }],
    },
    {
      $pull: {
        watchLater: video._id,
        watchHistory: video._id,
      },
    },
  )

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Video deleted successfully'))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, 'Invalid video ID')
  }

  const video = await Video.findById(videoId)

  if (!video) {
    throw new ApiError(404, 'Video not found')
  }
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      'You are not allowed to toggle publish status for this video',
    )
  }

  video.isPublished = !video.isPublished
  const updatedVideo = await video.save()

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedVideo,
        'Video publish status toggled successfully',
      ),
    )
})

export {
  getAllVideos,
  getTrendingVideos,
  publishAVideo,
  getVideoById,
  getWatchLaterVideos,
  addToWatchLater,
  removeFromWatchLater,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
}
