import { useEffect, useState } from "react"
import { getAllVideos, getTweets } from "../api"
import { Link } from "react-router-dom"
import { useAuth } from '../context/authContext'
import dayjs from "dayjs"

export default function Home() {
  const [videos, setVideos] = useState([])
  const [tweets, setTweets] = useState([])
  const [loading, setLoading] = useState(true)

  const { user } = useAuth()

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const [videoRes, tweetRes] = await Promise.all([
          getAllVideos(),
          getTweets()
        ])

        setVideos(videoRes.data?.data?.videos || []);
        setTweets(tweetRes.data?.data || [])

      } catch (error) {
        console.error("Failed to fetch videos or tweets:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [user?._id])

  // Convert seconds to "mm:ss" format
  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-blue-500 mb-4"></div>
          <p className="text-gray-400 text-lg">Loading awesome content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4 animate-in fade-in slide-in-from-top-4 duration-700">
            Welcome to VidTwit
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto animate-in fade-in slide-in-from-top-5 duration-700 delay-150">
            Discover amazing videos and trending tweets from creators around the world
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Videos Section - Takes 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-6">
            {/* Latest Videos Card */}
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">
              <div className="p-6 border-b border-gray-700/50 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                    </div>
                    Latest Videos
                  </h2>
                  <Link 
                    to="/videos" 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all transform hover:scale-105 text-sm font-medium shadow-lg shadow-blue-600/30"
                  >
                    View All
                  </Link>
                </div>
              </div>

              <div className="p-6">
                {videos.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎬</div>
                    <p className="text-gray-400 text-lg">No videos available yet</p>
                    <Link 
                      to="/upload-video"
                      className="inline-block mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                    >
                      Upload First Video
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {videos.slice(0, 5).map((video, index) => (
                      <Link
                        key={video._id}
                        to={`/watch/${video._id}`}
                        className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl transition-all group border border-gray-700/30 hover:border-blue-500/30"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="relative w-full sm:w-48 h-32 flex-shrink-0 overflow-hidden rounded-lg">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          {video.duration && (
                            <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded font-medium">
                              {formatDuration(video.duration)}
                            </span>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>

                        <div className="flex-1 space-y-2">
                          <h3 className="font-semibold text-lg text-white line-clamp-2 group-hover:text-blue-400 transition">
                            {video.title}
                          </h3>
                          <p className="text-sm text-gray-400 line-clamp-2">
                            {video.description}
                          </p>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-blue-400 font-medium">{video.owner?.username}</span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-500">{video.views || 0} views</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Profile Section */}
            {user ? (
              <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl shadow-2xl border border-purple-500/30 overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    Your Profile
                  </h2>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      <img
                        src={user?.avatar}
                        alt="Profile"
                        className="w-16 h-16 rounded-full object-cover ring-4 ring-purple-500/50"
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-gray-900"></div>
                    </div>
                    <div>
                      <p className="font-bold text-lg text-white">
                        {user.fullName || user.username}
                      </p>
                      <p className="text-sm text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-300 mb-4">
                    <p className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      Member since {dayjs(user.createdAt).format("MMM YYYY")}
                    </p>
                  </div>
                  <Link
                    to="/profile"
                    className="block w-full text-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all transform hover:scale-105 font-medium shadow-lg shadow-purple-600/30"
                  >
                    View Full Profile
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 p-6 text-center">
                <div className="text-5xl mb-4">👋</div>
                <h3 className="text-xl font-bold text-white mb-2">Join VidTwit</h3>
                <p className="text-gray-400 mb-4">Sign in to unlock all features</p>
                <Link
                  to="/login"
                  className="block w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all transform hover:scale-105 font-medium shadow-lg shadow-blue-600/30"
                >
                  Sign In
                </Link>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                  </svg>
                  Quick Actions
                </h2>
                <div className="space-y-3">
                  <Link
                    to="/upload-video"
                    className="flex items-center gap-3 p-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg transition-all group"
                  >
                    <div className="p-2 bg-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">Upload Video</p>
                      <p className="text-xs text-gray-400">Share your content</p>
                    </div>
                  </Link>

                  <Link
                    to="/upload-tweet"
                    className="flex items-center gap-3 p-3 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg transition-all group"
                  >
                    <div className="p-2 bg-green-600 rounded-lg group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">Post Tweet</p>
                      <p className="text-xs text-gray-400">Share your thoughts</p>
                    </div>
                  </Link>

                  <Link
                    to="/playlists"
                    className="flex items-center gap-3 p-3 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg transition-all group"
                  >
                    <div className="p-2 bg-purple-600 rounded-lg group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">My Playlists</p>
                      <p className="text-xs text-gray-400">Organize videos</p>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent Tweets */}
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">
              <div className="p-6 border-b border-gray-700/50 bg-gradient-to-r from-green-600/10 to-blue-600/10">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <div className="p-2 bg-green-600 rounded-lg">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Recent Tweets
                </h2>
              </div>

              <div className="p-4 max-h-[500px] overflow-y-auto space-y-3 custom-scrollbar">
                {tweets.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">💬</div>
                    <p className="text-gray-400">No tweets yet</p>
                  </div>
                ) : (
                  tweets.slice(0, 5).map((tweet) => (
                    <Link
                      key={tweet._id}
                      to={`/tweet/${tweet._id}`}
                      className="block p-4 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-700/30 hover:border-green-500/30 transition-all group"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium text-green-400 text-sm">{tweet.owner?.username}</p>
                        <span className="text-xs text-gray-500">
                          {dayjs(tweet.createdAt).fromNow()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 line-clamp-3 group-hover:text-white transition">
                        {tweet.content}
                      </p>
                    </Link>
                  ))
                )}
              </div>

              {tweets.length > 5 && (
                <div className="p-4 border-t border-gray-700/50">
                  <Link
                    to="/tweets"
                    className="block w-full text-center px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition font-medium"
                  >
                    View All Tweets
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(34, 197, 94, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 197, 94, 0.7);
        }
      `}</style>
    </div>
  )
}