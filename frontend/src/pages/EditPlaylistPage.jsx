import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getPlaylistById, updatePlaylist } from "../api"
import { useAuth } from "../context/authContext"

/**
 * EditPlaylistPage component provides form to edit existing playlists
 * @returns {JSX.Element} Edit playlist page component
 */
export default function EditPlaylistPage() {
  const { playlistId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  })
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(true)
  const [error, setError] = useState("")
  const [playlist, setPlaylist] = useState(null)

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        setFetchLoading(true)
        const response = await getPlaylistById(playlistId)
        const playlistData = response.data?.data
        
        if (!playlistData) {
          setError("Playlist not found")
          return
        }

        // Check if user owns this playlist
        if (playlistData.owner?._id !== user?._id) {
          setError("You don't have permission to edit this playlist")
          return
        }

        setPlaylist(playlistData)
        setFormData({
          name: playlistData.name,
          description: playlistData.description
        })
      } catch (err) {
        console.error("Failed to fetch playlist:", err)
        setError(err.response?.data?.message || "Failed to load playlist")
      } finally {
        setFetchLoading(false)
      }
    }

    if (playlistId && user) {
      fetchPlaylist()
    }
  }, [playlistId, user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.description.trim()) {
      setError("Please fill in all fields")
      return
    }

    try {
      setLoading(true)
      setError("")
      
      await updatePlaylist(playlistId, formData)
      
      // Redirect back to playlist detail
      navigate(`/playlist/${playlistId}`)
    } catch (err) {
      console.error("Failed to update playlist:", err)
      setError(err.response?.data?.message || "Failed to update playlist")
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Edit Playlist</h1>
          <p className="text-gray-400 mb-6">Please log in to edit playlists</p>
          <button 
            onClick={() => navigate("/login")} 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Login
          </button>
        </div>
      </div>
    )
  }

  if (fetchLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <span className="loading loading-spinner loading-lg text-blue-500"></span>
          <span className="ml-3 text-gray-400">Loading playlist...</span>
        </div>
      </div>
    )
  }

  if (error && !playlist) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => navigate("/playlists")} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Back to Playlists
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Edit Playlist</h1>
          <p className="text-gray-400">Update your playlist information</p>
        </div>

        {/* Form */}
        <div className="bg-gray-900 rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Playlist Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Playlist Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter playlist name"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={100}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.name.length}/100 characters
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your playlist"
                rows={4}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                maxLength={500}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/500 characters
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate(`/playlist/${playlistId}`)}
                className="flex-1 bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name.trim() || !formData.description.trim()}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Updating...
                  </>
                ) : (
                  "Update Playlist"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}