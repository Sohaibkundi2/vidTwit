import mongoose from 'mongoose';
import { Notification } from '../models/notification.model.js';
import { ApiResponse } from '../utils/ApiResponce.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { createdAt: -1 },
    populate: { path: 'sender', select: 'username avatar' },
  };

  const notifications = await Notification.paginate(
    { recipient: req.user._id },
    options
  );

  return res
    .status(200)
    .json(new ApiResponse(200, notifications, 'Notifications fetched successfully'));
});

const markAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    throw new ApiError(400, 'Invalid notification ID');
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: req.user._id },
    { read: true },
    { new: true }
  );

  if (!notification) {
    throw new ApiError(404, 'Notification not found or access denied');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, notification, 'Notification marked as read'));
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, read: false },
    { read: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'All notifications marked as read'));
});

const deleteNotification = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
        throw new ApiError(400, 'Invalid notification ID');
    }

    const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        recipient: req.user._id
    });

    if (!notification) {
        throw new ApiError(404, 'Notification not found or access denied');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Notification deleted successfully'));
});

export { getNotifications, markAsRead, markAllAsRead, deleteNotification };
