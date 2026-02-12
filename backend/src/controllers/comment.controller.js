import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import { Notification } from "../models/notification.model.js"
import ApiError from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponce.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: {
      path: "owner",
      select: "username fullName avatar",
    },
  };

  const result = await Comment.paginate({ video: videoId }, options);

  return res
    .status(200)
    .json(
      new ApiResponse(200, result, "Comments fetched successfully")
    );
});


const addComment = asyncHandler(async (req, res) => {
    const videoId = req.params.videoId;
    const { content } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content cannot be empty");
    }

    const newComment = await Comment.create({
        content: content,
        video: videoId,
        owner: req.user?._id,
    })

    await newComment.populate("owner", "username avatar");

    // Notification Logic
    try {
        const video = await Video.findById(videoId);
        if (video && video.owner.toString() !== req.user._id.toString()) {
            const notification = await Notification.create({
                recipient: video.owner,
                sender: req.user._id,
                type: 'COMMENT',
                message: `${req.user.username} commented on your video "${video.title}"`,
                url: `/video/${videoId}`
            });

            // Emit socket event
            if (req.io) {
                req.io.to(video.owner.toString()).emit('new-notification', notification);
            }
        }
    } catch (error) {
        console.error("Error sending notification for comment:", error);
    }

    return res
        .status(201)
        .json(new ApiResponse(201, newComment, "Comment added successfully"));
})

const updateComment = asyncHandler(async (req, res) => {

    const { commentId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content cannot be empty");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }
    if (comment.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this comment");
    }

    comment.content = content;
    await comment.save();

    await comment.populate("owner", "username avatar");

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment updated successfully"));


})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;

    if(!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }   
if (comment.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this comment");
    }

    await comment.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Comment deleted successfully"));
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
