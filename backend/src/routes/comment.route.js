import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { checkOwnership } from '../middlewares/checkOwnership.js';
import { Comment } from '../models/comment.model.js';
import {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment
} from '../controllers/comment.controller.js';

const router = Router();


router.get('/:videoId', getVideoComments);


router.post('/:videoId', verifyJWT, addComment);


router.patch(
  '/update/:commentId',
  verifyJWT,
  checkOwnership(Comment, 'commentId'),
  updateComment,
);

router.delete(
  '/delete/:commentId',
  verifyJWT,
  checkOwnership(Comment, 'commentId'),
  deleteComment,
);

export default router;
