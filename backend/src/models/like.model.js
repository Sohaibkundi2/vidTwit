import mongoose, { Schema } from 'mongoose';

const likeSchema = new Schema(
  {
    likedBy: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    video: {
      type: mongoose.Types.ObjectId,
      ref: 'Video',
      default: null,
    },
    comment: {
      type: mongoose.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
  },
  { timestamps: true }
);

likeSchema.pre('validate', function (next) {
  const targets = [this.video, this.comment].filter(Boolean)

  if (targets.length !== 1) {
    return next(new Error('A like must reference exactly one target'))
  }

  next()
})

likeSchema.index(
  { likedBy: 1, video: 1 },
  { unique: true, partialFilterExpression: { video: { $type: 'objectId' } } }
);

likeSchema.index(
  { likedBy: 1, comment: 1 },
  { unique: true, partialFilterExpression: { comment: { $type: 'objectId' } } }
);

export const Like = mongoose.model('Like', likeSchema);
