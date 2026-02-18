import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import VideoCard from "../compunents/VideoCard"
import { useAuth } from "../context/authContext"
import { useNavigate } from "react-router-dom"
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import AddToPlaylistModal from "../compunents/AddToPlaylistModal";

dayjs.extend(relativeTime);

import {
  getVideoById,
  getAllVideos,
  getComments,
  addComment,
  toggleSubscription,
  getSubscribers,
  deleteComment,
  updateComment,
} from "../api"


export default function VideoPlayerPage() {
  const { videoId } = useParams()
  const [video, setVideo] = useState(null)
  const [otherVideos, setOtherVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editedContent, setEditedContent] = useState("");

  const [subscribers, setSubscribers] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showDescription, setShowDescription] = useState(false);

  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [singleRes, allRes, commentRes] = await Promise.all([
          getVideoById(videoId),
          getAllVideos(),
          getComments(videoId),
        ]);

        const videoData = singleRes.data?.data || null;
        setVideo(videoData);

        setOtherVideos(
          allRes.data?.data?.videos?.filter((v) => v._id !== videoId) || []
        );
        setComments(commentRes?.data.data?.docs || []);
      } catch (err) {
        console.error("Failed to load video, comments, or suggestions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [videoId]);

  useEffect(() => {
    const fetchSubscribers = async () => {
      if (video?.owner?._id && user?._id) {
        try {
          const res = await getSubscribers(video.owner._id);
          const subs = res.data?.data || [];

          setSubscribers(subs);
          const isUserSubscribed = subs.some(sub => sub.subscriber._id === user._id);
          setIsSubscribed(isUserSubscribed);

        } catch (err) {
          console.error("Failed to load subscribers:", err);
        }
      }
    };

    fetchSubscribers();
  }, [video?.owner?._id, user?._id]);

  const handleSubscribe = async () => {
    if (!user) {
      setMessage("Please login to subscribe.");
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    try {
      await toggleSubscription(video.owner._id);
      setIsSubscribed((prev) => !prev);
      const res = await getSubscribers(video.owner._id);
      setSubscribers(res.data?.data || []);
      setMessage(isSubscribed ? "Unsubscribed successfully!" : "Subscribed successfully!");
    } catch (err) {
      const msg = err?.response?.data?.message || "Something went wrong while subscribing.";
      setMessage(msg)
      console.error("Subscribe failed", err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    if (!user) {
      setMessage("Please login to comment.");
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    try {
      const res = await addComment(videoId, { content: newComment });
      setComments((prev) => [res.data.data, ...prev]);
      setNewComment("");
      setMessage("Comment added!");
    } catch (err) {
      console.error("Comment failed", err);
      setMessage("Failed to add comment");
    }
  };

  const startEditing = (id, content) => {
    setEditingCommentId(id);
    setEditedContent(content);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditedContent("");
  };

  const handleUpdateComment = async (e, commentId) => {
    e.preventDefault();
    try {
      const res = await updateComment(commentId, { content: editedContent });
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? res.data.data : c))
      );
      cancelEditing();
      setMessage("Comment updated!");
    } catch (err) {
      console.error("Update failed", err);
      setMessage("Failed to update comment");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setMessage("Comment deleted!");
    } catch (err) {
      console.error("Delete failed", err);
      setMessage("Failed to delete comment");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-blue-500 mb-4"></div>
          <p className="text-gray-400">Loading video...</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">🎥</div>
          <h2 className="text-2xl font-bold text-white mb-2">Video not found</h2>
          <p className="text-gray-400 mb-6">The video you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/videos')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            Browse Videos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Video Section */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video Player */}
            <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl ring-1 ring-gray-700">
              <video
                src={video.videoFile}
                controls
                className="w-full h-full"
                poster={video.thumbnail}
                autoPlay
              />
            </div>

            {/* Video Title */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 shadow-lg">
              <h1 className="text-2xl font-bold text-white mb-2">{video.title}</h1>
              
              {/* Stats Row */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  <span>{video.views?.toLocaleString() || 0} views</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span>{dayjs(video.createdAt).format('MMM DD, YYYY')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSubscribe}
                  disabled={!user}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-medium transition-all transform hover:scale-105 ${
                    isSubscribed 
                      ? "bg-gray-600 hover:bg-gray-700 text-white" 
                      : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/50"
                  } ${!user ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {isSubscribed ? (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Subscribed
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                      </svg>
                      Subscribe
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowPlaylistModal(true)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-all transform hover:scale-105 shadow-lg shadow-blue-600/50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  Save
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setMessage("Link copied!");
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-full font-medium transition-all transform hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>
              </div>
            </div>

            {/* Channel Info */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={video.owner?.avatar || "/default-avatar.png"}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-blue-500"
                    alt={video.owner?.username}
                  />
                  <div>
                    <p className="font-bold text-lg text-white">{video.owner?.username}</p>
                    <p className="text-sm text-gray-400">
                      {subscribers.length.toLocaleString()} subscriber{subscribers.length !== 1 && "s"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mt-4">
                <button
                  onClick={() => setShowDescription(!showDescription)}
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium transition"
                >
                  {showDescription ? "Hide" : "Show"} description
                  <svg 
                    className={`w-4 h-4 transition-transform ${showDescription ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showDescription && (
                  <div className="mt-3 p-4 bg-gray-900/50 rounded-lg">
                    <p className="text-gray-300 whitespace-pre-wrap">{video.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                {comments.length} Comment{comments.length !== 1 && 's'}
              </h3>

              {/* Comment Input */}
              <form onSubmit={handleAddComment} className="mb-6">
                <div className="flex gap-3">
                  {user && (
                    <img
                      src={user.avatar || "/default-avatar.png"}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      alt="Your avatar"
                    />
                  )}
                  <div className="flex-1">
                    <input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder={user ? "Add a comment..." : "Login to comment..."}
                      disabled={!user}
                    />
                    <div className="flex gap-2 mt-2">
                      <button 
                        type="submit" 
                        disabled={!user || !newComment.trim()}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition"
                      >
                        Comment
                      </button>
                      {newComment && (
                        <button 
                          type="button"
                          onClick={() => setNewComment("")}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">💬</div>
                    <p className="text-gray-400">No comments yet. Be the first to comment!</p>
                  </div>
                ) : (
                  comments.map((c) => (
                    <div key={c._id} className="flex gap-3 p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900 transition">
                      <img
                        src={c.owner?.avatar || "/default-avatar.png"}
                        alt={c.owner?.username}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white">{c.owner?.fullName}</span>
                          <span className="text-xs text-gray-500">@{c.owner?.username}</span>
                          <span className="text-xs text-gray-500">•</span>
                          <span className="text-xs text-gray-500">{dayjs(c.createdAt).fromNow()}</span>
                        </div>

                        {editingCommentId === c._id ? (
                          <form onSubmit={(e) => handleUpdateComment(e, c._id)} className="space-y-2">
                            <input
                              type="text"
                              value={editedContent}
                              onChange={(e) => setEditedContent(e.target.value)}
                              className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex gap-2">
                              <button 
                                type="submit" 
                                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditing}
                                className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <p className="text-gray-300 break-words">{c.content}</p>
                        )}
                      </div>

                      {user && c.owner._id === user._id && editingCommentId !== c._id && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => startEditing(c._id, c.content)}
                            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded transition"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteComment(c._id)}
                            className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded transition"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Suggested Videos */}
          <div className="space-y-4">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 shadow-lg sticky top-4">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
                Up Next
              </h3>
              
              {otherVideos.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">🎬</div>
                  <p className="text-gray-400 text-sm">No suggestions available</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 custom-scrollbar">
                  {otherVideos.slice(0, 10).map((v) => (
                    <VideoCard key={v._id} video={v} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast Message */}
      {message && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
          <div className="bg-gray-800 text-white px-6 py-3 rounded-lg shadow-2xl border border-gray-700 flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            {message}
          </div>
        </div>
      )}

      {/* Playlist Modal */}
      {showPlaylistModal && (
        <AddToPlaylistModal
          videoId={videoId}
          onClose={() => setShowPlaylistModal(false)}
        />
      )}

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.7);
        }
      `}</style>
    </div>
  );
}