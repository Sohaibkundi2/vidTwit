import express from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notification.controller.js';

const router = express.Router();

router.use(verifyJWT);

router.route('/').get(getNotifications);
router.route('/mark-all-read').patch(markAllAsRead);
router.route('/:notificationId').patch(markAsRead).delete(deleteNotification);

export default router;
