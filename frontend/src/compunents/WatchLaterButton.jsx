import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/authContext"
import { useWatchLater } from "../context/watchLaterContext"

export default function WatchLaterButton({
  video,
  className = "",
  savedClassName = "",
  unsavedClassName = "",
  showLabel = false,
  onSuccess,
}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isInWatchLater, isPending, toggleVideo } = useWatchLater()

  const saved = isInWatchLater(video?._id) || video?.isInWatchLater
  const pending = isPending(video?._id)

  const handleClick = async event => {
    event.preventDefault()
    event.stopPropagation()

    if (!user) {
      navigate("/login")
      return
    }

    try {
      const didSave = await toggleVideo(video)
      if (onSuccess) {
        onSuccess(didSave ? (saved ? "Removed from Watch Later" : "Saved to Watch Later") : null)
      }
    } catch (error) {
      if (onSuccess) {
        onSuccess(error?.response?.data?.message || "Failed to update Watch Later")
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`${className} ${saved ? savedClassName : unsavedClassName}`.trim()}
      title={saved ? "Remove from Watch Later" : "Save to Watch Later"}
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 4.75A1.75 1.75 0 017.75 3h8.5A1.75 1.75 0 0118 4.75v16.19a.75.75 0 01-1.09.67L12 19.13l-4.91 2.48A.75.75 0 016 20.94V4.75z"
        />
      </svg>
      {showLabel && <span>{saved ? "Saved" : "Watch Later"}</span>}
    </button>
  )
}