import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import WatchLaterButton from "./WatchLaterButton";
import RepostButton from "./RepostButton";
import { useWatchLater } from "../context/watchLaterContext";

export default function VideoCard({ video }) {
  const { isInWatchLater } = useWatchLater();
  const [isDesktop, setIsDesktop] = useState(false);
  
  useEffect(() => {
    const checkIsDesktop = () => window.innerWidth >= 1024;
    setIsDesktop(checkIsDesktop());
    
    const handleResize = () => setIsDesktop(checkIsDesktop());
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const thumbnail = video?.thumbnail;
  const videoUrl = video?.videoFile;
  const videoId = video?._id;
  const title = video?.title;
  const channel = video?.owner?.username;
  const views = video?.views || 0;
  const duration = video?.duration;
  const saved = isInWatchLater(video?._id) || video?.isInWatchLater;

  // Convert seconds to "mm:ss" format
const formatDuration = (seconds) => {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};


  return (
    <Link
      to={`/watch/${videoId}`}
      className="block bg-gray-900 rounded-lg overflow-hidden hover:shadow-lg transition relative"
    >
      {/* Video or Thumbnail */}
      {isDesktop ? (
        <video
          src={videoUrl}
          poster={thumbnail}
          className="w-full h-60 object-cover"
          preload="metadata"
          muted
          loop
          onMouseEnter={(e) => e.target.play()}
          onMouseLeave={(e) => {
            e.target.pause();
            e.target.currentTime = 0;
          }}
        ></video>
      ) : (
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-60 object-cover"
        />
      )}

      <WatchLaterButton
        video={video}
        className="absolute left-3 top-3 z-10 inline-flex items-center justify-center rounded-full border border-white/15 p-2 backdrop-blur transition hover:-translate-y-0.5"
        savedClassName="bg-blue-500 text-white"
        unsavedClassName="bg-black/70 text-white hover:bg-blue-600"
      />

      {/* Duration Overlay */}
      {duration && (
        <span className="absolute top-50 right-3 bg-gray-900 bg-opacity-70 text-white text-xs px-1.5 py-0.5 rounded">
           {formatDuration(video?.duration)}
        </span>
      )}

      {/* Info Section */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-white font-semibold truncate">{title}</h3>
          {saved && (
            <span className="rounded-full bg-blue-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-300">
              Saved
            </span>
          )}
        </div>
        <p className="text-gray-400 text-sm">{channel}</p>
        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-gray-500">
          <span>{views} views</span>
          <RepostButton
            contentType="video"
            item={video}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 transition"
            activeClassName="bg-blue-500/15 text-blue-300"
            inactiveClassName="bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
          />
        </div>
      </div>
    </Link>
  );
}
