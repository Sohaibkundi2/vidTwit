import mongoose, { Schema } from 'mongoose'

const repostSchema = new Schema(
  {
    repostedBy: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    video: {
      type: mongoose.Types.ObjectId,
      ref: 'Video',
    },
    tweet: {
      type: mongoose.Types.ObjectId,
      ref: 'Tweet',
    },
  },
  { timestamps: true },
)

repostSchema.pre('validate', function (next) {
  const targetCount = Number(Boolean(this.video)) + Number(Boolean(this.tweet))

  if (targetCount !== 1) {
    return next(new Error('A repost must reference exactly one target'))
  }

  next()
})

repostSchema.index(
  { repostedBy: 1, video: 1 },
  {
    unique: true,
    partialFilterExpression: {
      video: { $exists: true },
    },
  },
)

repostSchema.index(
  { repostedBy: 1, tweet: 1 },
  {
    unique: true,
    partialFilterExpression: {
      tweet: { $exists: true },
    },
  },
)

export const Repost = mongoose.model('Repost', repostSchema)
import mongoose from "mongoose";

const repostSchema = new mongoose.Schema(
  {
    tweet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tweet",
      required: true,
    },
    repostedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

repostSchema.index({ tweet: 1, repostedBy: 1 }, { unique: true });

export const Repost = mongoose.model("Repost", repostSchema);
