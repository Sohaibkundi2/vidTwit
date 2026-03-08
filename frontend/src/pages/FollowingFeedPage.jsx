import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { getFollowingFeed } from "../api";
import VideoCard from "../compunents/VideoCard";
import TweetCard from "../compunents/TweetCard";

const FILTERS = [
  { id: "all", label: "All activity" },
  { id: "video", label: "Videos" },
  { id: "tweet", label: "Tweets" },
];

const formatFeedDate = (value) => dayjs(value).format("MMM D, YYYY h:mm A");

export default function FollowingFeedPage() {
  const [feedItems, setFeedItems] = useState([]);
  const [channels, setChannels] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        setLoading(true);
        const response = await getFollowingFeed({ page: 1, limit: 12 });
        const data = response.data?.data || {};

        setFeedItems(data.items || []);
        setChannels(data.channels || []);
        setHasMore(Boolean(data.hasMore));
        setTotalItems(data.totalItems || 0);
        setPage(1);
      } catch (error) {
        console.error("Failed to fetch following feed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timer = setTimeout(() => setMessage(""), 2500);
    return () => clearTimeout(timer);
  }, [message]);

  const filteredItems = useMemo(() => {
    if (filter === "all") {
      return feedItems;
    }

    return feedItems.filter((item) => item.type === filter);
  }, [feedItems, filter]);

  const videoCount = useMemo(
    () => feedItems.filter((item) => item.type === "video").length,
    [feedItems],
  );
  const tweetCount = useMemo(
    () => feedItems.filter((item) => item.type === "tweet").length,
    [feedItems],
  );

  const handleLoadMore = async () => {
    try {
      const nextPage = page + 1;
      setLoadingMore(true);

      const response = await getFollowingFeed({ page: nextPage, limit: 12 });
      const data = response.data?.data || {};

      setFeedItems((current) => [...current, ...(data.items || [])]);
      setHasMore(Boolean(data.hasMore));
      setTotalItems(data.totalItems || totalItems);
      setPage(nextPage);
    } catch (error) {
      console.error("Failed to load more following activity:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 px-4 py-16 text-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 px-8 py-20 text-center shadow-2xl backdrop-blur">
          <div className="loading loading-spinner loading-lg text-blue-400"></div>
          <p className="mt-4 text-lg text-gray-300">Loading your follow feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_35%),linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#111827_100%)] px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-[28px] border border-blue-400/20 bg-slate-950/70 p-6 shadow-[0_30px_80px_rgba(2,6,23,0.45)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="mb-3 inline-flex items-center rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-blue-200">
                Following Feed
              </p>
              <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
                Fresh posts from the creators you follow.
              </h1>
              <p className="mt-3 text-base text-slate-300 md:text-lg">
                Stay on top of new videos and tweets without digging through the full public feed.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Following</p>
                <p className="mt-2 text-2xl font-bold text-white">{channels.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Loaded</p>
                <p className="mt-2 text-2xl font-bold text-white">{feedItems.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Total activity</p>
                <p className="mt-2 text-2xl font-bold text-white">{totalItems}</p>
              </div>
            </div>
          </div>

          {channels.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {channels.slice(0, 8).map((channel) => (
                <div
                  key={channel._id}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
                >
                  <img
                    src={channel.avatar}
                    alt={channel.username}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                  <span>{channel.fullName || channel.username}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {message && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {message}
          </div>
        )}

        <section className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-slate-950/60 p-5 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((option) => {
              const isActive = filter === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFilter(option.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                      : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-slate-400">
            <span>{videoCount} videos</span>
            <span>{tweetCount} tweets</span>
            <span>{dayjs().format("MMM D, YYYY")}</span>
          </div>
        </section>

        {filteredItems.length === 0 ? (
          <section className="rounded-[28px] border border-dashed border-white/15 bg-slate-950/50 px-6 py-16 text-center backdrop-blur">
            <div className="mx-auto max-w-2xl">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-500/10 text-3xl text-blue-300">
                ∞
              </div>
              <h2 className="mt-6 text-3xl font-bold text-white">
                {channels.length === 0 ? "Your follow feed is empty." : "No items match this filter yet."}
              </h2>
              <p className="mt-3 text-base text-slate-400">
                {channels.length === 0
                  ? "Follow a few creators first, then their newest uploads and tweets will appear here."
                  : "Switch filters or load more activity after the people you follow post something new."}
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  to="/videos"
                  className="rounded-full bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-500"
                >
                  Explore videos
                </Link>
                <Link
                  to="/tweets"
                  className="rounded-full border border-white/10 bg-white/5 px-5 py-3 font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
                >
                  Browse tweets
                </Link>
              </div>
            </div>
          </section>
        ) : filter === "tweet" ? (
          <section className="space-y-4">
            {filteredItems.map((item) => (
              <TweetCard
                key={`${item.type}-${item.data._id}`}
                tweet={item.data}
                onMessage={setMessage}
              />
            ))}
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {filteredItems.map((item) => (
              <div key={`${item.type}-${item.data._id}`} className="space-y-3">
                <div className="flex items-center justify-between px-1 text-xs uppercase tracking-[0.24em] text-slate-500">
                  <span>{item.type === "video" ? "Video" : "Tweet"}</span>
                  <span>{formatFeedDate(item.createdAt)}</span>
                </div>
                {item.type === "video" ? (
                  <VideoCard video={item.data} />
                ) : (
                  <TweetCard tweet={item.data} onMessage={setMessage} />
                )}
              </div>
            ))}
          </section>
        )}

        {hasMore && filter === "all" && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="rounded-full border border-blue-400/30 bg-blue-500/10 px-6 py-3 font-medium text-blue-100 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingMore ? "Loading more..." : "Load more activity"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}