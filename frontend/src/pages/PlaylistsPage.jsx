import { useEffect, useState } from "react"
import { getUserPlaylists } from "../api"
import { useAuth } from "../context/authContext"
import PlaylistCard from "../compunents/PlaylistCard"
import { Link } from "react-router-dom"

/**
 * PlaylistsPage component displays all user playlists in a grid layout
 * @returns {JSX.Element} Playlists page component
 */
export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!user?._id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await getUserPlaylists(user._id)
        setPlaylists(response.data?.data || [])
      } catch (err) {
        console.error("Failed to fetch playlists:", err)
        setError(err.response?.data?.message || "Failed to load playlists")
      } finally {
        setLoading(false)
      }
    }

    fetchPlaylists()
  }, [user?._id])

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">My Playlists</h1>
          <p className="text-gray-400 mb-6">Please log in to view your playlists</p>
          <Link 
            to="/login" 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Login
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-6">My Playlists</h1>
        <div className="flex items-center justify-center py-12">
          <span className="loading loading-spinner loading-lg text-blue-500"></span>
          <span className="ml-3 text-gray-400">Loading playlists...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-6">My Playlists</h1>
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">My Playlists</h1>
        <Link 
          to="/create-playlist" 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Playlist
        </Link>
      </div>

      {/* Playlists Grid */}
      {playlists.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-6">
            <svg className="w-24 h-24 text-gray-600 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No playlists yet</h3>
          <p className="text-gray-400 mb-6">Create your first playlist to organize your favorite videos</p>
          <Link 
            to="/create-playlist" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Your First Playlist
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {playlists.map((playlist) => (
            <PlaylistCard key={playlist._id} playlist={playlist} />
          ))}
        </div>
      )}
    </div>
  )
}