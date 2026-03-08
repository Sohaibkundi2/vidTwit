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