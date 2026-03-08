import { getTweetById, getTweets } from "../api";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/authContext";
import TweetCard from "../compunents/TweetCard";

export default function TweetPage() {
  const { tweetId } = useParams();
  const [tweets, setTweets] = useState([]);
  const [selectedTweet, setSelectedTweet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

    const { user } = useAuth();

  useEffect(() => {
    const fetchTweets = async () => {
      try {
        if (tweetId) {
          const response = await getTweetById(tweetId);
          setSelectedTweet(response.data?.data || null);
          setTweets([]);
        } else {
          const response = await getTweets();
          setTweets(response.data?.data || []);
          setSelectedTweet(null);
        }
      } catch (error) {
        console.error("Failed to fetch tweets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTweets();
  }, [tweetId]);

  useEffect(() => {
    if (!message) return undefined;

    const timer = setTimeout(() => setMessage(""), 2500);
    return () => clearTimeout(timer);
  }, [message]);

  return (
    <div className="container mx-auto px-4 py-6">
      {message && (
        <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {message}
        </div>
      )}

      {/* Header + Button wrapper */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
        <h1 className="text-3xl font-bold">{tweetId ? "Tweet Detail" : "Recent Tweets"}</h1>
        <button
          onClick={() => navigate("/upload-tweet")}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
        >
          + Add Tweet
        </button>
      </div>

      {/* Tweet list */}
      {loading ? (
        <p className="text-gray-400">Loading tweets...</p>
      ) : tweetId ? (
        selectedTweet ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => navigate('/tweets')}
              className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
              <span>←</span>
              Back to tweets
            </button>
            <TweetCard tweet={selectedTweet} isDetailView={true} onMessage={setMessage} />
          </div>
        ) : (
          <p className="text-gray-400">Tweet not found.</p>
        )
      ) : (
        <ul className="space-y-3">
          {tweets.length === 0 ? (
            <p className="text-gray-400">No tweets available.</p>
          ) : (
            tweets.map((tweet) => (
              <li
                key={tweet._id}
                className=" rounded border border-gray-950 bg-gray-900"
              >
                {/* <Link
                  to={`/tweet/${tweet._id}`}
                  className="block hover:bg-gray-800 transition-all"
                >
                  <p className="font-medium">{tweet.owner?.username}</p>
                  <p className="text-sm text-gray-400">{tweet.content}</p>
                </Link> */}
                <TweetCard key={tweet._id} tweet={tweet} onMessage={setMessage} />
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
