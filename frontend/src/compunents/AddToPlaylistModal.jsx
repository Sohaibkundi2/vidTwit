import { useEffect, useState } from 'react';
import { getUserPlaylists, addVideoToPlaylist, createPlaylist } from '../api';
import { useAuth } from '../context/authContext';
import Toast from './Toast';

export default function AddToPlaylistModal({ videoId, onClose }) {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!user?._id) return;
      
      try {
        setLoading(true);
        const response = await getUserPlaylists(user._id);
        setPlaylists(response.data?.data || []);
      } catch (error) {
        console.error('Failed to fetch playlists:', error);
        setToast({ message: 'Failed to load playlists', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, [user?._id]);

  const handleAddToPlaylist = async (playlistId) => {
    try {
      setActionLoading(true);
      await addVideoToPlaylist(playlistId, videoId);
      setToast({ message: 'Video added to playlist successfully!', type: 'success' });
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error('Failed to add video:', error);
      const errorMsg = error.response?.data?.message || 'Failed to add video to playlist';
      setToast({ message: errorMsg, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    
    if (!newPlaylistName.trim() || !newPlaylistDesc.trim()) {
      setToast({ message: 'Please fill in all fields', type: 'warning' });
      return;
    }

    try {
      setActionLoading(true);
      const response = await createPlaylist({
        name: newPlaylistName,
        description: newPlaylistDesc
      });
      
      const newPlaylistId = response.data?.data?._id;
      
      // Add video to the newly created playlist
      if (newPlaylistId) {
        await addVideoToPlaylist(newPlaylistId, videoId);
        setToast({ message: 'Playlist created and video added!', type: 'success' });
        setTimeout(() => onClose(), 1500);
      }
    } catch (error) {
      console.error('Failed to create playlist:', error);
      setToast({ message: error.response?.data?.message || 'Failed to create playlist', type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div 
          className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-gray-700 animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Save to Playlist
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded-full transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="loading loading-spinner loading-lg text-blue-500 mb-4"></div>
              <p className="text-gray-400">Loading your playlists...</p>
            </div>
          ) : (
            <>
              {/* Existing Playlists */}
              {playlists.length > 0 && (
                <div className="space-y-2 mb-6">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Your Playlists</h3>
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {playlists.map((playlist) => (
                      <button
                        key={playlist._id}
                        onClick={() => handleAddToPlaylist(playlist._id)}
                        disabled={actionLoading}
                        className="w-full text-left p-4 bg-gray-700/50 hover:bg-gray-700 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600/50 hover:border-blue-500/50 group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-white font-medium group-hover:text-blue-400 transition">{playlist.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              <span className="text-sm text-gray-400">{playlist.videos?.length || 0} videos</span>
                            </div>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {playlists.length === 0 && !showCreateNew && (
                <div className="text-center py-8 mb-4">
                  <div className="text-5xl mb-4">📝</div>
                  <p className="text-gray-400 mb-2">No playlists yet</p>
                  <p className="text-sm text-gray-500">Create your first playlist below</p>
                </div>
              )}

              {/* Create New Playlist */}
              {!showCreateNew ? (
                <button
                  onClick={() => setShowCreateNew(true)}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/30 font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create New Playlist
                </button>
              ) : (
                <form onSubmit={handleCreatePlaylist} className="space-y-4 bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">New Playlist</h3>
                    <button
                      type="button"
                      onClick={() => setShowCreateNew(false)}
                      className="text-gray-400 hover:text-white text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Playlist Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., My Favorites"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition"
                      disabled={actionLoading}
                      maxLength={100}
                    />
                    <p className="text-xs text-gray-500 mt-1">{newPlaylistName.length}/100 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Description
                    </label>
                    <textarea
                      placeholder="What's this playlist about?"
                      value={newPlaylistDesc}
                      onChange={(e) => setNewPlaylistDesc(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-none transition"
                      rows={3}
                      disabled={actionLoading}
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 mt-1">{newPlaylistDesc.length}/500 characters</p>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-600/30 font-medium flex items-center justify-center gap-2"
                    disabled={actionLoading || !newPlaylistName.trim() || !newPlaylistDesc.trim()}
                  >
                    {actionLoading ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Creating...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Create & Add Video
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
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
    </>
  );
}