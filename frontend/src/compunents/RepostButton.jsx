import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/authContext"
import { toggleTweetRepost, toggleVideoRepost } from "../api"

export default function RepostButton({
  contentType,
  item,
  className = "",
  activeClassName = "",
  inactiveClassName = "",
  showLabel = false,
  onMessage,
}) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [repostCount, setRepostCount] = useState(item?.repostCount || 0)
  const [isReposted, setIsReposted] = useState(Boolean(item?.isReposted))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setRepostCount(item?.repostCount || 0)
    setIsReposted(Boolean(item?.isReposted))
  }, [item?._id, item?.repostCount, item?.isReposted])

  const handleClick = async event => {
    event.preventDefault()
    event.stopPropagation()

    if (!user) {
      navigate("/login")
      return
    }

    if (loading || !item?._id) {
      return
    }

    try {
      setLoading(true)
      const response =
        contentType === "tweet"
          ? await toggleTweetRepost(item._id)
          : await toggleVideoRepost(item._id)

      const nextIsReposted = response.data?.data?.isReposted ?? false
      const nextRepostCount = response.data?.data?.repostCount ?? 0

      setIsReposted(nextIsReposted)
      setRepostCount(nextRepostCount)

      if (onMessage) {
        onMessage(
          nextIsReposted ? "Reposted successfully" : "Repost removed successfully",
        )
      }
    } catch (error) {
      if (onMessage) {
        onMessage(error?.response?.data?.message || "Failed to update repost")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      title={isReposted ? "Remove repost" : "Repost this content"}
      className={`${className} ${isReposted ? activeClassName : inactiveClassName}`.trim()}
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 1l4 4-4 4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 11V9a4 4 0 014-4h14" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 23l-4-4 4-4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13v2a4 4 0 01-4 4H3" />
      </svg>
      <span>{showLabel ? `Repost ${repostCount}` : repostCount}</span>
    </button>
  )
}