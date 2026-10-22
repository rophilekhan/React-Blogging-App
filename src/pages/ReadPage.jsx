import React, { useState, useEffect, useMemo, Suspense, lazy } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getSingleDocument, updateDocument } from "../firebase/methods";
import { useAuth } from "../contexts/AuthContext";
import Loader3D from "../components/ui/Loader3D";

// Dynamic chunk-splitting for contextual 3D scene
const DynamicScene = lazy(() => import("../components/3d/DynamicScene"));

const ReadPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scrollProgress, setScrollProgress] = useState(0);

  // Like state
  const [likesState, setLikesState] = useState({
    count: 0,
    isLiked: false,
    likedBy: [],
  });

  // Interactive toast notification for share / clipboard
  const [toastMessage, setToastMessage] = useState("");
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleShareStory = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: blog?.title || "SynthScroll Story",
      text: blog?.title ? `Read "${blog.title}" in 3D on SynthScroll` : "Explore this spatial story",
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        showToast("✨ Story shared via native device portal!");
        return;
      } catch (err) {
        if (err.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast("🔗 Story URL copied to clipboard!");
    } catch {
      showToast("Link: " + shareUrl);
    }
  };

  // Track window scroll progress for reading progress bar
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((scrollY / totalHeight) * 100);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch article from Firebase
  useEffect(() => {
    let isMounted = true;

    const fetchArticle = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getSingleDocument(id, "blogs");

        if (isMounted) {
          if (data) {
            setBlog(data);
            const userLiked = data.likedBy?.includes(user?.uid) || false;
            setLikesState({
              count: data.likes || 0,
              isLiked: userLiked,
              likedBy: data.likedBy || [],
            });
          } else {
            setError("Story not found or may have been removed.");
          }
        }
      } catch (err) {
        console.error("Error loading blog:", err);
        if (isMounted) setError("Failed to retrieve story from cloud.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (id) {
      fetchArticle();
    }
    return () => {
      isMounted = false;
    };
  }, [id, user?.uid]);

  // Handle Like Action
  const handleLike = async () => {
    if (!user || !blog) return;

    const currentlyLiked = likesState.isLiked;
    const updatedLikedBy = currentlyLiked
      ? likesState.likedBy.filter((uid) => uid !== user.uid)
      : [...likesState.likedBy, user.uid];

    const updatedCount = updatedLikedBy.length;

    setLikesState({
      count: updatedCount,
      isLiked: !currentlyLiked,
      likedBy: updatedLikedBy,
    });

    try {
      await updateDocument(
        { likes: updatedCount, likedBy: updatedLikedBy },
        id,
        "blogs"
      );
    } catch (err) {
      console.error("Failed to update like:", err);
    }
  };

  // Reading time calculation
  const readingTime = useMemo(() => {
    if (!blog?.content) return "1 min read";
    const words = blog.content.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 220);
    return `${minutes} min read`;
  }, [blog?.content]);

  // Format date
  const formattedDate = useMemo(() => {
    if (!blog) return "";
    if (blog.createdAt?.seconds) {
      return new Date(blog.createdAt.seconds * 1000).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
    if (blog.createdAtClient) {
      return new Date(blog.createdAtClient).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
    return "Recently published";
  }, [blog]);

  return (
    <div className="relative min-h-screen text-white select-none pb-28 bg-[#050714]">
      {/* ── Contextual 3D Background Scene with Suspense ───────────────────── */}
      <Suspense fallback={<Loader3D message="Generating Spatial Dimension..." />}>
        <DynamicScene category={blog?.category || "Technology"} />
      </Suspense>

      {/* ── Reading Progress Top Bar ───────────────────────────────────────── */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 z-50 transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* ── Top Navigation Bar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 px-4 sm:px-6 py-3.5 backdrop-blur-xl bg-slate-950/70 border-b border-white/10 flex items-center justify-between gap-2">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition-all shrink-0"
        >
          <span>←</span>
          <span className="hidden xs:inline">Back to Feed</span>
          <span className="xs:hidden">Feed</span>
        </button>

        <Link to="/landing" className="flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span className="text-xs sm:text-sm font-extrabold tracking-wider font-display bg-gradient-to-r from-white to-indigo-300 bg-clip-text text-transparent">
            SYNTHSCROLL
          </span>
        </Link>

        <div className="text-[11px] sm:text-xs text-slate-400 font-medium shrink-0">
          {readingTime}
        </div>
      </header>

      {/* ── Main Article Reader Viewport ───────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-3.5 sm:px-6 pt-6 sm:pt-10">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-10 h-10 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-400">Loading spatial article...</span>
          </div>
        ) : error || !blog ? (
          <div className="py-24 text-center p-6 sm:p-8 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-2xl">
            <div className="text-4xl mb-3">🌌</div>
            <h2 className="text-lg sm:text-xl font-bold text-white mb-2">{error || "Story not found"}</h2>
            <p className="text-xs text-slate-400 mb-6 max-w-sm mx-auto">
              The article you are looking for may have been removed or is in another dimension.
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all"
            >
              Return to Dashboard
            </button>
          </div>
        ) : (
          <motion.article
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="p-4 sm:p-8 md:p-12 rounded-3xl bg-slate-950/70 backdrop-blur-2xl border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.8)] relative overflow-hidden"
          >
            {/* Top Sheen */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-36 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Article Metadata Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-6 border-b border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl font-semibold bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                  {blog.category || "General"}
                </span>
                <span className="text-slate-400">{formattedDate}</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                  {(blog.authorName || "A")[0]}
                </div>
                <span className="text-slate-300 font-medium">
                  {blog.authorName || "Spatial Author"}
                </span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-display leading-[1.15] text-white mb-6">
              {blog.title}
            </h1>

            {/* Cover Image if available */}
            {blog.imageUrl && (
              <div className="relative w-full h-56 sm:h-80 md:h-96 rounded-2xl overflow-hidden border border-white/15 mb-8 shadow-2xl">
                <img
                  src={blog.imageUrl}
                  alt={blog.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
              </div>
            )}

            {/* Main Article Content */}
            <div className="space-y-5 text-slate-200 text-sm sm:text-base leading-relaxed tracking-wide font-sans">
              {blog.content.split("\n\n").map((paragraph, index) => (
                <p key={index} className="leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Article Footer & Interactive Engagement Bar */}
            <div className="mt-8 sm:mt-12 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {user ? (
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                      likesState.isLiked
                        ? "bg-pink-500/20 border-pink-500/40 text-pink-300 shadow-md shadow-pink-500/20"
                        : "bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
                    }`}
                    title={likesState.isLiked ? "Liked" : "Like this story"}
                  >
                    <motion.span
                      whileTap={{ scale: 1.4 }}
                      animate={likesState.isLiked ? { scale: [1, 1.3, 1] } : {}}
                    >
                      {likesState.isLiked ? "❤️" : "🤍"}
                    </motion.span>
                    <span>{likesState.count} Likes</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs">
                    <span>❤️</span>
                    <span>{likesState.count} Likes</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleShareStory}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs transition-all flex items-center gap-1.5 shadow-sm"
                  title="Share Story"
                >
                  <span>🔗</span>
                  <span>Share Story</span>
                </button>
              </div>
            </div>
          </motion.article>
        )}
      </main>

      {/* ── Toast Notification Pill ──────────────────────────────────────── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-2xl bg-indigo-600/90 border border-indigo-400/40 text-white text-xs font-medium shadow-2xl backdrop-blur-xl flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReadPage;
