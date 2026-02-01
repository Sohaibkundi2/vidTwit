import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { getPlaylistById, deletePlaylist, removeVideoFromPlaylist } from "../api"
import { useAuth } from "../context/authContext"
import dayjs from "dayjs"

/**
 * PlaylistDetailPage component displays individual playlist with video management
 * @returns {JSX.Element} Playlist detail page component
 */
export default function PlaylistDetailPage() {
  const { playlistId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [playlist, setPlaylist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        setLoading(true)
        const response = await getPlaylistById(playlistId)
        setPlaylist(response.data?.data)
      } catch (err) {
        console.error("Failed to fetch playlist:", err)
        setError(err.response?.data?.message || "Failed to load playlist")
      } finally {
        setLoading(false)
      }
    }

    if (playlistId) {
      fetchPlaylist()
    }
  }, [playlistId])

  const handleDeletePlaylist = async () => {
    try {
      await deletePlaylist(playlistId)
      navigate("/playlists")
    } catch (err) {
      console.error("Failed to delete playlist:", err)
      alert("Failed to delete playlist")
    }
  }

  const handleRemoveVideo = async (videoId) => {
    try {
      await removeVideoFromPlaylist(playlistId, videoId)
      // Update local state
      setPlaylist(prev => ({
        ...prev,
        videos: prev.videos.filter(video => video._id !== videoId)
      }))
    } catch (err) {
      console.error("Failed to remove video:", err)
      alert("Failed to remove video from playlist")
    }
  }

  const formatDuration = (seconds) => {
    if (!seconds) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <span className="loading loading-spinner loading-lg text-blue-500"></span>
          <span className="ml-3 text-gray-400">Loading playlist...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">{error}</p>
          <Link 
            to="/playlists" 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Back to Playlists
          </Link>
        </div>
      </div>
    )
  }

  if (!playlist) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">Playlist not found</p>
          <Link 
            to="/playlists" 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Back to Playlists
          </Link>
        </div>
      </div>
    )
  }

  const isOwner = user?._id === playlist.owner?._id

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Playlist Header */}
      <div className="bg-gray-900 rounded-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Playlist Thumbnail */}
          <div className="w-full md:w-80 h-48 bg-gray-800 rounded-lg overflow-hidden">
            {playlist.videos && playlist.videos.length > 0 && playlist.videos[0].thumbnail ? (
              <img
                src={playlist.videos[0].thumbnail}
                alt={playlist.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                </svg>
              </div>
            )}
          </div>

          {/* Playlist Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">{playlist.name}</h1>
            <p className="text-gray-400 mb-4">{playlist.description}</p>
            
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <span className="flex items-center gap-2">
                <img
                  src={playlist.owner?.avatar}
                  alt={playlist.owner?.username}
                  className="w-6 h-6 rounded-full"
                />
                {playlist.owner?.username}
              </span>
              <span>{playlist.videos?.length || 0} videos</span>
              <span>Created {dayjs(playlist.createdAt).format("MMM DD, YYYY")}</span>
            </div>

            {/* Action Buttons */}
            {isOwner && (
              <div className="flex gap-3">
                <Link
                  to={`/playlist/${playlist._id}/edit`}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  Edit Playlist
                </Link>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                >
                  Delete Playlist
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Videos List */}
      <div className="bg-gray-900 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Videos</h2>
        
        {playlist.videos && playlist.videos.length > 0 ? (
          <div className="space-y-4">
            {playlist.videos.map((video, index) => (
              <div key={video._id} className="flex gap-4 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition">
                <span className="text-gray-400 text-sm w-8 flex-shrink-0 pt-2">
                  {index + 1}
                </span>
                
                <Link to={`/watch/${video._id}`} className="flex gap-4 flex-1">
                  <div className="relative w-32 h-20 flex-shrink-0">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover rounded"
                    />
                    {video.duration && (
                      <span className="absolute bottom-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 py-0.5 rounded">
                        {formatDuration(video.duration)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-white font-medium mb-1 line-clamp-2">{video.title}</h3>
                    <p className="text-gray-400 text-sm line-clamp-2">{video.description}</p>
                  </div>
                </Link>

                {isOwner && (
                  <button
                    onClick={() => handleRemoveVideo(video._id)}
                    className="text-red-400 hover:text-red-300 p-2"
                    title="Remove from playlist"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">This playlist is empty</p>
            {isOwner && (
              <Link
                to="/videos"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Browse Videos to Add
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Delete Playlist</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete "{playlist.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePlaylist}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}