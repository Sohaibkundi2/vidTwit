import { createContext, useContext, useEffect, useState } from "react"
import {
  addToWatchLater as apiAddToWatchLater,
  getWatchLaterVideos,
  removeFromWatchLater as apiRemoveFromWatchLater,
} from "../api"
import { useAuth } from "./authContext"

const WatchLaterContext = createContext()

const normalizeSavedVideo = video => ({
  ...video,
  isInWatchLater: true,
})

export const WatchLaterProvider = ({ children }) => {
  const { user } = useAuth()
  const [watchLaterVideos, setWatchLaterVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [pendingVideoIds, setPendingVideoIds] = useState([])

  const refreshWatchLater = async () => {
    if (!user) {
      setWatchLaterVideos([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await getWatchLaterVideos()
      setWatchLaterVideos(response.data?.data || [])
    } catch (error) {
      console.error("Failed to fetch watch later videos:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshWatchLater()
  }, [user?._id])

  const isInWatchLater = videoId =>
    watchLaterVideos.some(video => video._id === videoId)

  const isPending = videoId => pendingVideoIds.includes(videoId)

  const markPending = videoId => {
    setPendingVideoIds(currentIds =>
      currentIds.includes(videoId) ? currentIds : [...currentIds, videoId],
    )
  }

  const unmarkPending = videoId => {
    setPendingVideoIds(currentIds =>
      currentIds.filter(currentId => currentId !== videoId),
    )
  }

  const addVideo = async video => {
    if (!video?._id || isPending(video._id)) {
      return false
    }

    markPending(video._id)

    try {
      await apiAddToWatchLater(video._id)

      setWatchLaterVideos(currentVideos => {
        const nextVideos = currentVideos.filter(
          currentVideo => currentVideo._id !== video._id,
        )

        return [normalizeSavedVideo(video), ...nextVideos]
      })

      return true
    } catch (error) {
      console.error("Failed to add video to watch later:", error)
      throw error
    } finally {
      unmarkPending(video._id)
    }
  }

  const removeVideo = async videoId => {
    if (!videoId || isPending(videoId)) {
      return false
    }

    markPending(videoId)

    try {
      await apiRemoveFromWatchLater(videoId)
      setWatchLaterVideos(currentVideos =>
        currentVideos.filter(video => video._id !== videoId),
      )
      return true
    } catch (error) {
      console.error("Failed to remove video from watch later:", error)
      throw error
    } finally {
      unmarkPending(videoId)
    }
  }

  const toggleVideo = async video => {
    if (isInWatchLater(video._id)) {
      return removeVideo(video._id)
    }

    return addVideo(video)
  }

  return (
    <WatchLaterContext.Provider
      value={{
        watchLaterVideos,
        loading,
        refreshWatchLater,
        addVideo,
        removeVideo,
        toggleVideo,
        isInWatchLater,
        isPending,
      }}
    >
      {children}
    </WatchLaterContext.Provider>
  )
}

export const useWatchLater = () => {
  const context = useContext(WatchLaterContext)

  if (!context) {
    throw new Error("useWatchLater must be used within WatchLaterProvider")
  }

  return context
}