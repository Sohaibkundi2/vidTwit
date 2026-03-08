import { Link } from "react-router-dom"
import VideoCard from "../compunents/VideoCard"
import { useWatchLater } from "../context/watchLaterContext"

export default function WatchLaterPage() {
  const { loading, watchLaterVideos } = useWatchLater()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-blue-500/20 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent p-6 shadow-2xl shadow-slate-950/30 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-blue-300/70">Library</p>
            <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">Watch Later</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
              Keep videos here for the next session without building a playlist first.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-right backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Saved Videos</p>
            <p className="mt-2 text-3xl font-bold text-white">{watchLaterVideos.length}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="text-center">
              <div className="loading loading-spinner loading-lg text-blue-500"></div>
              <p className="mt-4 text-slate-400">Loading your saved videos...</p>
            </div>
          </div>
        ) : watchLaterVideos.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/70 px-6 py-16 text-center shadow-2xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-500/10 text-blue-300">
              <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 4.75A1.75 1.75 0 017.75 3h8.5A1.75 1.75 0 0118 4.75v16.19a.75.75 0 01-1.09.67L12 19.13l-4.91 2.48A.75.75 0 016 20.94V4.75z" />
              </svg>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-white">Nothing saved yet</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-400">
              Save videos from cards or the player page and they will show up here instantly.
            </p>
            <Link
              to="/videos"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 font-semibold text-white transition hover:-translate-y-1 hover:bg-blue-700"
            >
              Explore Videos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {watchLaterVideos.map(video => (
              <VideoCard key={video._id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}