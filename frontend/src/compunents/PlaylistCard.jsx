import { Link } from "react-router-dom"
import dayjs from "dayjs"

/**
 * PlaylistCard component displays individual playlist information
 * @param {Object} playlist - The playlist object containing playlist data
 * @returns {JSX.Element} Playlist card component
 */
export default function PlaylistCard({ playlist }) {
  const { _id, name, description, videos, owner, createdAt } = playlist

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
      <Link to={`/playlist/${_id}`} className="block">
        {/* Playlist Thumbnail - Show first video thumbnail or placeholder */}
        <div className="relative h-48 bg-gray-800">
          {videos && videos.length > 0 && videos[0].thumbnail ? (
            <img
              src={videos[0].thumbnail}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <svg className="w-16 h-16 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
              </svg>
            </div>
          )}
          
          {/* Video count overlay */}
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            {videos?.length || 0} videos
          </div>
        </div>

        {/* Playlist Info */}
        <div className="p-4">
          <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">
            {name}
          </h3>
          
          <p className="text-gray-400 text-sm mb-3 line-clamp-2">
            {description}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-2">
              <img
                src={owner?.avatar}
                alt={owner?.username}
                className="w-5 h-5 rounded-full"
              />
              {owner?.username}
            </span>
            <span>
              {dayjs(createdAt).format("MMM DD, YYYY")}
            </span>
          </div>
        </div>
      </Link>
    </div>
  )
}