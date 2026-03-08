import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import RepostButton from "./RepostButton";

const TweetCard = ({ tweet, isDetailView = false, onMessage }) => {
  if (!tweet) return null;

  const { _id, content, owner } = tweet;
  const { user } = useAuth();
  const navigate = useNavigate();

  const isUploader = owner?._id === user?._id;

  const handleCardClick = () => {
    if (!isDetailView) {
      navigate(`/tweet/${_id}`);
    }
  };

  return (
    <div
      className="relative group w-full  rounded-xl p-4 shadow hover:shadow-lg transition cursor-pointer text-white/90 bg-gray-950"
      onClick={handleCardClick}
    >
      {/* Tweet Content */}
      <div className="space-y-2">
        <p className="text-sm text-gray-300 break-all"> {owner?.username}</p>
        <p className="text-base text-white">{content}</p>
        <div className="flex items-center justify-between gap-3 pt-2 text-xs text-gray-400">
          <span>{tweet?.repostCount || 0} reposts</span>
          <RepostButton
            contentType="tweet"
            item={tweet}
            onMessage={onMessage}
            showLabel={isDetailView}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition"
            activeClassName="bg-green-500/15 text-green-300"
            inactiveClassName="bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
          />
        </div>
      </div>

      {/* Edit/Delete Buttons */}
      {isUploader && (
        <div
          className="flex justify-end gap-2 mt-4"
          onClick={(e) => e.stopPropagation()}
        >
          <Link
            to={`/update-tweet/${_id}`}
            className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Edit
          </Link>
          <Link
            to={`/delete-tweet/${_id}`}
            className="text-sm px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete
          </Link>
        </div>
      )}
    </div>
  );
};

export default TweetCard;
