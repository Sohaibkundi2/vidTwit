import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { createPlaylist } from "../api"
import { useAuth } from "../context/authContext"

/**
 * CreatePlaylistPage component provides form to create new playlists
 * @returns {JSX.Element} Create playlist page component
 */
export default function CreatePlaylistPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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
      
      const response = await createPlaylist(formData)
      const newPlaylist = response.data?.data
      
      if (!newPlaylist?._id) {
        throw new Error("Failed to create playlist - invalid response")
      }
      
      // Redirect to the new playlist
      navigate(`/playlist/${newPlaylist._id}`)
    } catch (err) {
      console.error("Failed to create playlist:", err)
      setError(err.response?.data?.message || "Failed to create playlist")
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Create Playlist</h1>
          <p className="text-gray-400 mb-6">Please log in to create a playlist</p>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create New Playlist</h1>
          <p className="text-gray-400">Organize your favorite videos into a playlist</p>
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
                onClick={() => navigate("/playlists")}
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
                    Creating...
                  </>
                ) : (
                  "Create Playlist"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-gray-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Tips for creating playlists:</h3>
          <ul className="text-gray-400 space-y-2 text-sm">
            <li>• Choose a descriptive name that reflects the content</li>
            <li>• Write a clear description to help others understand your playlist</li>
            <li>• You can add videos to your playlist after creating it</li>
            <li>• You can edit or delete your playlist anytime</li>
          </ul>
        </div>
      </div>
    </div>
  )
}