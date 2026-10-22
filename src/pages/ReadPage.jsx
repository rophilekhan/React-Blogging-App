import React, { useState, useEffect, useMemo, Suspense, lazy } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  getSingleDocument,
  updateDocument,
  addCommentToBlog,
  getBlogComments,
  toggleSavePost,
  getUserSavedPostIds,
} from "../firebase/methods";
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

  // Bookmark / Saved state
  const [isSaved, setIsSaved] = useState(() => {
    if (!user?.uid || !id) return false;
    try {
      const saved = JSON.parse(
        localStorage.getItem(`synthscroll_saved_${user.uid}`) || "[]"
      );
      return saved.some((item) => {
        if (!item) return false;
        if (typeof item === "string") return item === id;
        if (typeof item === "object") return item.documentId === id || item.id === id;
        return false;
      });
    } catch {
      return false;
    }
  });

  // Comments state
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Interactive toast notification for share / clipboard / comments
  const [toastMessage, setToastMessage] = useState("");
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Check saved state from Firestore / cache
  useEffect(() => {
    if (!user?.uid || !id) return;
    getUserSavedPostIds(user.uid).then((list) => {
      if (Array.isArray(list)) {
        const found = list.some((item) => {
          if (!item) return false;
          if (typeof item === "string") return item === id;
          if (typeof item === "object") return item.documentId === id || item.id === id;
          return false;
        });
        setIsSaved(found);
      }
    });
  }, [user?.uid, id]);

  // Native Web Share API with Clipboard Fallback
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

  // Toggle Bookmark / Save Post
  const handleToggleSave = async () => {
    if (!user) {
      showToast("🔒 Sign in to bookmark and save stories!");
      return;
    }
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    showToast(nextSaved ? "🔖 Story saved to bookmarks!" : "📑 Story removed from bookmarks");
    try {
      await toggleSavePost(user.uid, blog || id);
    } catch (err) {
      console.error("Failed to toggle bookmark:", err);
      setIsSaved(!nextSaved);
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

  // Fetch comments subcollection
  useEffect(() => {
    let isMounted = true;

    const fetchComments = async () => {
      if (!id) return;
      try {
        setLoadingComments(true);
        const data = await getBlogComments(id);
        if (isMounted) {
          setComments(data || []);
        }
      } catch (err) {
        console.warn("Failed to fetch comments:", err);
      } finally {
        if (isMounted) setLoadingComments(false);
      }
    };

    fetchComments();
    return () => {
      isMounted = false;
    };
  }, [id]);

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

  // Handle Post Comment
  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast("🔒 Please sign in to post a comment!");
      return;
    }
    if (!newCommentText.trim() || isSubmittingComment) return;

    try {
      setIsSubmittingComment(true);
      const commentPayload = {
        content: newCommentText.trim(),
        uid: user.uid,
        authorName: user.displayName || user.email?.split("@")[0] || "Spatial Creator",
        authorEmail: user.email || "",
        authorPhoto: user.photoURL || "",
      };

      const created = await addCommentToBlog(id, commentPayload);
      setComments((prev) => [created, ...prev]);
      setNewCommentText("");
      showToast("💬 Comment added to community discussion!");
    } catch (err) {
      console.error("Failed to add comment:", err);
      showToast("Failed to post comment: " + (err.message || "Network error"));
    } finally {
      setIsSubmittingComment(false);
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

  // Format comment timestamp
  const formatCommentDate = (comment) => {
    if (comment.createdAt?.seconds) {
      return new Date(comment.createdAt.seconds * 1000).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (comment.createdAtClient) {
      return new Date(comment.createdAtClient).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return "Just now";
  };

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
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-medium transition-all shrink-0"
        >
          <span>←</span>
          <span className="hidden xs:inline">Back to Feed</span>
          <span className="xs:hidden">Feed</span>
        </button>

        <Link to="/" className="flex items-center gap-2 shrink-0">
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
              onClick={() => navigate("/")}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all"
            >
              Return to Feed
            </button>
          </div>
        ) : (
          <>
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
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Likes Button */}
                  {user ? (
                    <button
                      onClick={handleLike}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
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
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs">
                      <span>❤️</span>
                      <span>{likesState.count} Likes</span>
                    </div>
                  )}

                  {/* Bookmark / Save Story Button */}
                  <button
                    onClick={handleToggleSave}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                      isSaved
                        ? "bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-md shadow-amber-500/20"
                        : "bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10"
                    }`}
                    title={isSaved ? "Saved in Bookmarks" : "Save Story to Profile"}
                  >
                    <motion.span whileTap={{ scale: 1.3 }}>
                      {isSaved ? "🔖" : "📑"}
                    </motion.span>
                    <span>{isSaved ? "Saved" : "Save Story"}</span>
                  </button>
                </div>

                {/* Share Button (Native API + Fallback) */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShareStory}
                    className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                    title="Share Story"
                  >
                    <span>🔗</span>
                    <span>Share Story</span>
                  </button>
                </div>
              </div>
            </motion.article>

            {/* ── Community Discussion Section (Firestore 'comments' subcollection) ── */}
            <motion.section
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 sm:mt-8 p-4 sm:p-8 rounded-3xl bg-slate-950/70 backdrop-blur-2xl border border-white/15 shadow-2xl relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">💬</span>
                  <h3 className="text-lg sm:text-xl font-bold font-display text-white">
                    Community Discussion
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
                    {comments.length}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 hidden xs:inline">
                  Decentralized Mesh
                </span>
              </div>

              {/* Comment Input Box */}
              {user ? (
                <form onSubmit={handlePostComment} className="mb-8">
                  <div className="flex gap-3 items-start">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || "User"}
                        className="w-9 h-9 rounded-full object-cover border border-white/20 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white uppercase shrink-0">
                        {(user.displayName || user.email || "U")[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <textarea
                        rows={3}
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder="Share your perspectives, debate, or questions on this story..."
                        className="w-full px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/15 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 backdrop-blur-md transition-all resize-none"
                      />
                      <div className="flex items-center justify-between mt-2.5">
                        <span className="text-[11px] text-slate-500">
                          {newCommentText.length > 0
                            ? `${newCommentText.length} characters`
                            : "Rich spatial commentary"}
                        </span>
                        <button
                          type="submit"
                          disabled={!newCommentText.trim() || isSubmittingComment}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
                        >
                          {isSubmittingComment ? (
                            <>
                              <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
                              <span>Posting...</span>
                            </>
                          ) : (
                            <>
                              <span>Post Comment</span>
                              <span>→</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🔒</span>
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        Join the Community Discussion
                      </h4>
                      <p className="text-xs text-slate-400">
                        Sign in to share your thoughts, critiques, or debate with authors.
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all shrink-0"
                  >
                    Sign In to Comment
                  </Link>
                </div>
              )}

              {/* Comments List */}
              {loadingComments ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-center text-slate-400 text-xs">
                  <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  <span>Loading community discussion...</span>
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {comments.map((comment, index) => (
                    <motion.div
                      key={comment.id || `comment-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.04 }}
                      className="p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          {comment.authorPhoto ? (
                            <img
                              src={comment.authorPhoto}
                              alt={comment.authorName}
                              className="w-7 h-7 rounded-full object-cover border border-white/20"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                              {(comment.authorName || "A")[0]}
                            </div>
                          )}
                          <span className="text-xs font-semibold text-slate-200">
                            {comment.authorName || "Spatial Creator"}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {formatCommentDate(comment)}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-9">
                        {comment.content}
                      </p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-8 sm:py-10 text-center rounded-2xl bg-white/[0.02] border border-dashed border-white/10 p-6">
                  <div className="text-3xl mb-2">💭</div>
                  <h4 className="text-sm font-semibold text-white mb-1">
                    No comments yet
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Be the first spatial creator to share your perspective on this story.
                  </p>
                </div>
              )}
            </motion.section>
          </>
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
