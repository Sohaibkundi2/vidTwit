import React, { useEffect, useState } from "react";
import { getAllVideos, getTrendingVideos } from "../api";
import VideoCard from "../compunents/VideoCard";
import { useNavigate } from "react-router-dom";
import AddToPlaylistModal from "../compunents/AddToPlaylistModal";

const VideoDetails = () => {
  const [videos, setVideos] = useState([]);
  const [trendingVideos, setTrendingVideos] = useState([]);
  const [trendingRange, setTrendingRange] = useState("week");
  const [loading, setLoading] = useState(true);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [selectedVideoId, setSelectedVideoId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await getAllVideos();
        setVideos(res.data?.data?.videos || []);
      } catch (err) {
        console.error("Failed to load videos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  useEffect(() => {
    const fetchTrendingVideos = async () => {
      try {
        setTrendingLoading(true);
        const res = await getTrendingVideos(trendingRange);
        setTrendingVideos(res.data?.data?.videos || []);
      } catch (err) {
        console.error("Failed to load trending videos:", err);
      } finally {
        setTrendingLoading(false);
      }
    };

    fetchTrendingVideos();
  }, [trendingRange]);

  return (
    <div className="container mx-auto px-4 py-6 text-white">
      <div className="mb-8 overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 shadow-2xl">
        <div className="flex flex-col gap-4 border-b border-blue-500/10 bg-gradient-to-r from-blue-600/12 via-indigo-600/10 to-transparent p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.38em] text-blue-300/70">Discovery</p>
            <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">Trending Now</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-400 md:text-base">
              Ranked using views, recent likes, recent comments, and recency so the strongest videos rise fast.
            </p>
          </div>

          <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-sm">
            {[
              { key: "day", label: "24 Hours" },
              { key: "week", label: "7 Days" },
            ].map(option => (
              <button
                key={option.key}
                type="button"
                onClick={() => setTrendingRange(option.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  trendingRange === option.key
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                    : "text-slate-300 hover:bg-white/6"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {trendingLoading ? (
            <div className="flex min-h-[180px] items-center justify-center">
              <div className="text-center">
                <div className="loading loading-spinner loading-lg text-blue-500"></div>
                <p className="mt-4 text-slate-400">Calculating trending videos...</p>
              </div>
            </div>
          ) : trendingVideos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/70 px-6 py-12 text-center">
              <p className="text-lg font-semibold text-white">No trending videos yet</p>
              <p className="mt-2 text-slate-400">Once videos start getting engagement, the top performers will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              {trendingVideos.map((video, index) => (
                <div key={video._id} className="rounded-2xl border border-white/6 bg-white/[0.03] p-3 shadow-xl shadow-slate-950/30">
                  <div className="mb-3 flex items-center justify-between px-1">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-900/30">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-white">{index === 0 ? "Top Performer" : `Trending #${index + 1}`}</p>
                        <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{trendingRange === "day" ? "Last 24 Hours" : "Last 7 Days"}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
                      Score {video.trendingScore}
                    </span>
                  </div>

                  <VideoCard video={video} />

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-white/6 bg-slate-950/60 px-3 py-3 text-center">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Views</p>
                      <p className="mt-2 text-lg font-bold text-white">{video.views || 0}</p>
                    </div>
                    <div className="rounded-xl border border-white/6 bg-slate-950/60 px-3 py-3 text-center">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Likes</p>
                      <p className="mt-2 text-lg font-bold text-white">{video.likeCount || 0}</p>
                    </div>
                    <div className="rounded-xl border border-white/6 bg-slate-950/60 px-3 py-3 text-center">
                      <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Comments</p>
                      <p className="mt-2 text-lg font-bold text-white">{video.commentCount || 0}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Heading and Button in a Flexbox Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-white">All Videos</h1>
        <button
          onClick={() => navigate("/upload-video")}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 cursor-pointer transition"
        >
          + Add Video
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading videos...</p>
      ) : videos.length === 0 ? (
        <p className="text-gray-400">No videos available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map(video => (
            <div key={video._id} className="relative group">
              <VideoCard video={video} />
              
              {/* Save to Playlist Button - appears on hover */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedVideoId(video._id);
                }}
                className="absolute top-2 right-2 p-2 bg-black bg-opacity-70 hover:bg-opacity-90 text-white rounded-full transition opacity-0 group-hover:opacity-100"
                title="Save to playlist"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedVideoId && (
        <AddToPlaylistModal
          videoId={selectedVideoId}
          onClose={() => setSelectedVideoId(null)}
        />
      )}
    </div>
  );
};

export default VideoDetails;