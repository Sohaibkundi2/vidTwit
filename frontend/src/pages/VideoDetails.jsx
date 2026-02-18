import React, { useEffect, useState } from "react";
import { getAllVideos } from "../api";
import VideoCard from "../compunents/VideoCard";
import { useNavigate } from "react-router-dom";
import AddToPlaylistModal from "../compunents/AddToPlaylistModal";

const VideoDetails = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Heading and Button in a Flexbox Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">All Videos</h1>
        <button
          onClick={() => navigate("/upload-video")}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 cursor-pointer transition"
        >
          + Add Video
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading videos...</p>
      ) : videos.length === 0 ? (
        <p className="text-gray-500">No videos available.</p>
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