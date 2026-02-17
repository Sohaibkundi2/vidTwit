import mongoose, { Schema } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['LIKE', 'COMMENT', 'SUBSCRIBE'],
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String,
      required: true,
    },
    url: {
      type: String, // Link to the relevant content (e.g., /video/:id)
    },
  },
  { timestamps: true }
);

notificationSchema.plugin(mongoosePaginate);

export const Notification = mongoose.model('Notification', notificationSchema);
